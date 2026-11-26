use std::env;
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode, Stdio};

const DEFAULT_APP_PORT: u16 = 8999;
const MIN_APP_PORT: u64 = 1024;
const MAX_APP_PORT: u64 = 65535;

fn non_empty_env(name: &str) -> Option<OsString> {
    env::var_os(name).filter(|val| !val.to_string_lossy().trim().is_empty())
}

fn parse_env_port(name: &str) -> Option<u16> {
    non_empty_env(name)
        .and_then(|v| v.to_string_lossy().trim().parse::<u16>().ok())
        .filter(|&port| port > 0)
}

fn read_configured_port(data_dir: &Path) -> u16 {
    let settings_path = data_dir.join("data").join("settings").join("general.json");
    let Ok(content) = fs::read_to_string(settings_path) else {
        return DEFAULT_APP_PORT;
    };
    let clean = content.trim_start_matches('\u{FEFF}');
    let Ok(parsed) = serde_json::from_str::<serde_json::Value>(clean) else {
        return DEFAULT_APP_PORT;
    };
    parsed
        .get("app")
        .and_then(|app| app.get("port"))
        .and_then(|value| value.as_u64())
        .filter(|port| (MIN_APP_PORT..=MAX_APP_PORT).contains(port))
        .and_then(|port| u16::try_from(port).ok())
        .unwrap_or(DEFAULT_APP_PORT)
}

fn resolve_server_port(data_dir: &Path) -> OsString {
    let port = parse_env_port("VNWEB_PORT")
        .or_else(|| parse_env_port("PORT"))
        .unwrap_or_else(|| read_configured_port(data_dir));
    OsString::from(port.to_string())
}

fn resolve_app_dir(install_dir: &Path, explicit_app_dir: Option<&Path>, cwd: Option<&Path>) -> Result<PathBuf, String> {
    if let Some(dir) = explicit_app_dir {
        return Ok(dir.to_path_buf());
    }

    let bundled = install_dir.join("standalone");
    if bundled.join("server.js").is_file() {
        return Ok(bundled);
    }

    if let Some(cwd_path) = cwd {
        let dev_standalone = cwd_path.join(".next").join("standalone");
        if dev_standalone.join("server.js").is_file() {
            return Ok(dev_standalone);
        }
    }

    Err(format!(
        "无法定位 vnweb standalone 目录（已检查 {} 及当前工作目录 .next/standalone），请设置 VNWEB_APP_DIR 环境变量。",
        bundled.display()
    ))
}

fn resolve_data_dir(
    install_dir: &Path,
    explicit_data_dir: Option<&Path>,
    appdata_dir: Option<&Path>,
) -> PathBuf {
    if let Some(dir) = explicit_data_dir {
        return dir.to_path_buf();
    }

    let user_data = install_dir.join("user-data");
    if install_dir.join("portable").exists() || user_data.exists() {
        return user_data;
    }

    if cfg!(windows) {
        if let Some(appdata) = appdata_dir {
            return appdata.join("vnweb");
        }
    }

    user_data
}

fn resolve_node_bin(install_dir: &Path, explicit_node: Option<&Path>) -> PathBuf {
    if let Some(node) = explicit_node {
        return node.to_path_buf();
    }

    let bundled_node = install_dir.join("runtime").join("node.exe");
    if bundled_node.is_file() {
        return bundled_node;
    }

    PathBuf::from("node")
}

fn run() -> Result<i32, String> {
    let exe_path = env::current_exe().map_err(|e| format!("无法获取当前可执行文件路径: {e}"))?;
    let install_dir = exe_path
        .parent()
        .ok_or_else(|| "无法获取程序所在目录".to_string())?;

    let explicit_app_dir = non_empty_env("VNWEB_APP_DIR").map(PathBuf::from);
    let explicit_data_dir = non_empty_env("VNWEB_DATA_DIR").map(PathBuf::from);
    let explicit_node = non_empty_env("VNWEB_NODE_PATH").map(PathBuf::from);
    let appdata_dir = non_empty_env("APPDATA").map(PathBuf::from);
    let cwd = env::current_dir().ok();

    let data_dir = resolve_data_dir(
        install_dir,
        explicit_data_dir.as_deref(),
        appdata_dir.as_deref(),
    );

    let args: Vec<OsString> = env::args_os().skip(1).collect();
    if args.is_empty() {
        let desktop_exe = install_dir.join("vnweb-desktop.exe");
        if desktop_exe.is_file() {
            let mut cmd = Command::new(&desktop_exe);
            if let Some(ref explicit) = explicit_data_dir {
                cmd.env("VNWEB_DATA_DIR", explicit);
            }
            cmd.stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .map_err(|e| format!("启动桌面端失败 ({}): {e}", desktop_exe.display()))?;
            return Ok(0);
        }
    }

    let app_dir = resolve_app_dir(install_dir, explicit_app_dir.as_deref(), cwd.as_deref())?;
    let node_bin = resolve_node_bin(install_dir, explicit_node.as_deref());

    let mut cmd = Command::new(&node_bin);
    cmd.current_dir(&app_dir)
        .env("VNWEB_APP_DIR", &app_dir)
        .env("VNWEB_DATA_DIR", &data_dir);

    if args.is_empty() {
        let port = resolve_server_port(&data_dir);
        let hostname = non_empty_env("HOSTNAME").unwrap_or_else(|| OsString::from("0.0.0.0"));
        cmd.arg(app_dir.join("server.js"))
            .env("PORT", port)
            .env("HOSTNAME", hostname);
    } else {
        let cli_entry = app_dir.join("cli").join("vnweb-cli.mjs");
        if !cli_entry.is_file() {
            return Err(format!("找不到 CLI 入口文件: {}", cli_entry.display()));
        }
        cmd.arg(cli_entry).args(args);
    }

    let status = cmd
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status()
        .map_err(|e| format!("执行 Node 失败 ({}): {e}", node_bin.display()))?;

    Ok(status.code().unwrap_or(1))
}

fn main() -> ExitCode {
    match run() {
        Ok(code) => ExitCode::from((code & 0xff) as u8),
        Err(err) => {
            eprintln!("vnweb: {err}");
            ExitCode::FAILURE
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn make_temp_dir(label: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let dir = env::temp_dir().join(format!("vnweb-cli-test-{label}-{nanos}"));
        fs::create_dir_all(&dir).expect("create temp dir");
        dir
    }

    #[test]
    fn data_dir_prefers_explicit_env() {
        let install = make_temp_dir("explicit");
        fs::create_dir_all(install.join("user-data")).expect("user-data");
        let explicit = PathBuf::from("D:\\custom-data");
        let appdata = PathBuf::from("C:\\Users\\Test\\AppData\\Roaming");

        let resolved = resolve_data_dir(&install, Some(&explicit), Some(&appdata));
        assert_eq!(resolved, explicit);

        let _ = fs::remove_dir_all(&install);
    }

    #[test]
    fn data_dir_prefers_portable_or_user_data_marker() {
        let install = make_temp_dir("portable");
        fs::write(install.join("portable"), b"").expect("portable marker");
        let appdata = PathBuf::from("C:\\Users\\Test\\AppData\\Roaming");

        let resolved = resolve_data_dir(&install, None, Some(&appdata));
        assert_eq!(resolved, install.join("user-data"));

        let _ = fs::remove_dir_all(&install);
    }

    #[test]
    fn data_dir_falls_back_to_appdata_on_windows() {
        let install = make_temp_dir("appdata");
        let appdata = PathBuf::from("C:\\Users\\Test\\AppData\\Roaming");

        let resolved = resolve_data_dir(&install, None, Some(&appdata));
        if cfg!(windows) {
            assert_eq!(resolved, appdata.join("vnweb"));
        } else {
            assert_eq!(resolved, install.join("user-data"));
        }

        let _ = fs::remove_dir_all(&install);
    }

    #[test]
    fn reads_configured_port_with_safe_fallback() {
        let data_dir = make_temp_dir("port");
        assert_eq!(read_configured_port(&data_dir), DEFAULT_APP_PORT);

        let settings_dir = data_dir.join("data").join("settings");
        fs::create_dir_all(&settings_dir).expect("settings dir");
        let general_path = settings_dir.join("general.json");

        fs::write(&general_path, br#"{"app":{"port":9123}}"#).expect("write valid port");
        assert_eq!(read_configured_port(&data_dir), 9123);

        fs::write(&general_path, br#"{"app":{"port":80}}"#).expect("write low port");
        assert_eq!(read_configured_port(&data_dir), DEFAULT_APP_PORT);

        fs::write(&general_path, b"{invalid json").expect("write invalid");
        assert_eq!(read_configured_port(&data_dir), DEFAULT_APP_PORT);

        let _ = fs::remove_dir_all(&data_dir);
    }
}
