use std::env;
use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpListener, TcpStream};
use std::path::Path;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicU16, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use crate::paths::{read_app_settings, RuntimePaths, DEFAULT_APP_PORT};

#[cfg(windows)]
use std::os::windows::io::AsRawHandle;
#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[cfg(windows)]
mod win_job {
    use std::ptr;

    use windows_sys::Win32::Foundation::{CloseHandle, HANDLE};
    use windows_sys::Win32::System::JobObjects::{
        AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
        SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
    };

    pub struct JobHandle(HANDLE);

    unsafe impl Send for JobHandle {}
    unsafe impl Sync for JobHandle {}

    impl JobHandle {
        pub fn create_kill_on_close() -> Result<Self, String> {
            unsafe {
                let handle = CreateJobObjectW(ptr::null(), ptr::null());
                if handle.is_null() {
                    return Err("CreateJobObjectW failed".to_string());
                }

                let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
                info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

                let ok = SetInformationJobObject(
                    handle,
                    JobObjectExtendedLimitInformation,
                    (&info as *const JOBOBJECT_EXTENDED_LIMIT_INFORMATION).cast(),
                    std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                );
                if ok == 0 {
                    CloseHandle(handle);
                    return Err("SetInformationJobObject failed".to_string());
                }

                Ok(Self(handle))
            }
        }

        pub fn assign_process(&self, process_handle: HANDLE) -> Result<(), String> {
            unsafe {
                let ok = AssignProcessToJobObject(self.0, process_handle);
                if ok == 0 {
                    return Err("AssignProcessToJobObject failed".to_string());
                }
            }
            Ok(())
        }
    }

    impl Drop for JobHandle {
        fn drop(&mut self) {
            unsafe {
                if !self.0.is_null() {
                    CloseHandle(self.0);
                }
            }
        }
    }
}

struct RunningServer {
    child: Child,
    #[cfg(windows)]
    _job: Option<win_job::JobHandle>,
}

pub struct ServerManager {
    running: Mutex<Option<RunningServer>>,
    port: AtomicU16,
}

impl Default for ServerManager {
    fn default() -> Self {
        Self {
            running: Mutex::new(None),
            port: AtomicU16::new(0),
        }
    }
}

pub fn pick_available_port(preferred: u16) -> Result<u16, String> {
    let start = if preferred == 0 {
        DEFAULT_APP_PORT
    } else {
        preferred
    };
    let end = start.saturating_add(100);

    for port in start..=end {
        if TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return Ok(port);
        }
    }

    let listener = TcpListener::bind(("127.0.0.1", 0))
        .map_err(|e| format!("无法分配可用的本地端口: {e}"))?;
    let port = listener
        .local_addr()
        .map_err(|e| format!("读取分配端口失败: {e}"))?
        .port();
    Ok(port)
}

fn read_log_tail(log_file: &Path, max_lines: usize) -> String {
    match fs::read_to_string(log_file) {
        Ok(content) => {
            let lines: Vec<&str> = content.lines().collect();
            let start = lines.len().saturating_sub(max_lines);
            lines[start..].join("\n")
        }
        Err(_) => String::new(),
    }
}

fn probe_health_endpoint(port: u16) -> bool {
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let Ok(mut stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(300)) else {
        return false;
    };

    let _ = stream.set_read_timeout(Some(Duration::from_millis(800)));
    let _ = stream.set_write_timeout(Some(Duration::from_millis(800)));

    let request = b"GET /api/settings/data HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n";
    if stream.write_all(request).is_err() {
        return false;
    }

    let mut buf = [0u8; 64];
    let Ok(n) = stream.read(&mut buf) else {
        return false;
    };
    if n == 0 {
        return false;
    }

    let head = String::from_utf8_lossy(&buf[..n]);
    head.starts_with("HTTP/1.1 200") || head.starts_with("HTTP/1.0 200")
}

impl ServerManager {
    pub fn current_port(&self) -> u16 {
        self.port.load(Ordering::SeqCst)
    }

    pub fn current_url(&self, data_dir: &Path) -> String {
        if cfg!(debug_assertions) && env::var_os("VNWEB_FORCE_SIDECAR").is_none() {
            return "http://localhost:3000".to_string();
        }
        let port = self.current_port();
        if port == 0 {
            let configured = read_app_settings(data_dir).port;
            format!("http://127.0.0.1:{configured}")
        } else {
            format!("http://127.0.0.1:{port}")
        }
    }

    pub fn start(&self, paths: &RuntimePaths) -> Result<u16, String> {
        self.stop();

        fs::create_dir_all(&paths.data_dir)
            .map_err(|e| format!("创建数据目录失败 ({}): {e}", paths.data_dir.display()))?;
        if let Some(parent) = paths.log_file.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建日志目录失败 ({}): {e}", parent.display()))?;
        }

        let log_out = OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&paths.log_file)
            .map_err(|e| format!("打开日志文件失败 ({}): {e}", paths.log_file.display()))?;
        let log_err = log_out
            .try_clone()
            .map_err(|e| format!("复制日志文件句柄失败: {e}"))?;

        let preferred_port = env::var("VNWEB_PORT")
            .ok()
            .and_then(|v| v.trim().parse::<u16>().ok())
            .filter(|&p| p > 0)
            .unwrap_or_else(|| read_app_settings(&paths.data_dir).port);
        let port = pick_available_port(preferred_port)?;
        let hostname = env::var("VNWEB_HOST")
            .ok()
            .filter(|v| !v.trim().is_empty())
            .unwrap_or_else(|| "127.0.0.1".to_string());

        let server_js = paths.app_dir.join("server.js");
        if !server_js.is_file() {
            return Err(format!("找不到服务端入口文件: {}", server_js.display()));
        }

        let mut cmd = Command::new(&paths.node_bin);
        cmd.arg(&server_js)
            .current_dir(&paths.app_dir)
            .env("VNWEB_APP_DIR", &paths.app_dir)
            .env("VNWEB_DATA_DIR", &paths.data_dir)
            .env("PORT", port.to_string())
            .env("HOSTNAME", hostname)
            .stdin(Stdio::null())
            .stdout(Stdio::from(log_out))
            .stderr(Stdio::from(log_err));

        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let child = cmd.spawn().map_err(|e| {
            format!(
                "启动本地服务进程失败 ({}): {e}",
                paths.node_bin.display()
            )
        })?;

        #[cfg(windows)]
        let job = {
            let job = win_job::JobHandle::create_kill_on_close()?;
            job.assign_process(child.as_raw_handle() as windows_sys::Win32::Foundation::HANDLE)?;
            Some(job)
        };

        let mut guard = self
            .running
            .lock()
            .map_err(|_| "服务状态锁已被破坏".to_string())?;
        *guard = Some(RunningServer {
            child,
            #[cfg(windows)]
            _job: job,
        });
        self.port.store(port, Ordering::SeqCst);

        Ok(port)
    }

    pub fn wait_until_ready(
        &self,
        port: u16,
        log_file: &Path,
        timeout: Duration,
    ) -> Result<(), String> {
        let deadline = Instant::now() + timeout;

        loop {
            {
                let mut guard = self
                    .running
                    .lock()
                    .map_err(|_| "服务状态锁已被破坏".to_string())?;
                if let Some(running) = guard.as_mut() {
                    if let Some(status) = running
                        .child
                        .try_wait()
                        .map_err(|e| format!("检查服务进程状态失败: {e}"))?
                    {
                        let tail = read_log_tail(log_file, 30);
                        *guard = None;
                        self.port.store(0, Ordering::SeqCst);
                        return Err(if tail.is_empty() {
                            format!("本地服务提前退出（退出码：{status}）")
                        } else {
                            format!("本地服务提前退出（退出码：{status}）：\n{tail}")
                        });
                    }
                } else {
                    return Err("本地服务未启动".to_string());
                }
            }

            if probe_health_endpoint(port) {
                return Ok(());
            }

            if Instant::now() >= deadline {
                let tail = read_log_tail(log_file, 30);
                return Err(if tail.is_empty() {
                    format!("等待本地服务就绪超时（端口 {port}）。")
                } else {
                    format!("等待本地服务就绪超时（端口 {port}）：\n{tail}")
                });
            }

            std::thread::sleep(Duration::from_millis(150));
        }
    }

    pub fn stop(&self) {
        if let Ok(mut guard) = self.running.lock() {
            if let Some(mut running) = guard.take() {
                let _ = running.child.kill();
                let _ = running.child.wait();
            }
        }
        self.port.store(0, Ordering::SeqCst);
    }

    pub fn restart(&self, paths: &RuntimePaths) -> Result<u16, String> {
        self.stop();
        let port = self.start(paths)?;
        self.wait_until_ready(port, &paths.log_file, Duration::from_secs(30))?;
        Ok(port)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn picks_free_port_when_preferred_is_bound() {
        let occupied = TcpListener::bind(("127.0.0.1", 0)).expect("bind test listener");
        let busy_port = occupied.local_addr().expect("addr").port();

        let picked = pick_available_port(busy_port).expect("pick available port");
        assert_ne!(picked, busy_port);
        assert!(picked > 0);
    }
}
