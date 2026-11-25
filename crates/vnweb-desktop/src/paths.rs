use std::env;
use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use tauri::{AppHandle, Manager};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Clone, Debug)]
pub struct RuntimePaths {
    pub app_dir: PathBuf,
    pub data_dir: PathBuf,
    pub node_bin: PathBuf,
    pub log_file: PathBuf,
}

fn non_empty_env(name: &str) -> Option<OsString> {
    env::var_os(name).filter(|val| !val.to_string_lossy().trim().is_empty())
}

pub fn resolve_app_dir(
    explicit_app_dir: Option<&Path>,
    resource_dir: Option<&Path>,
    exe_dir: Option<&Path>,
    dev_repo_root: Option<&Path>,
) -> Result<PathBuf, String> {
    if let Some(dir) = explicit_app_dir {
        if dir.join("server.js").is_file() {
            return Ok(dir.to_path_buf());
        }
        return Err(format!(
            "VNWEB_APP_DIR 目录下未找到 server.js: {}",
            dir.display()
        ));
    }

    if let Some(res) = resource_dir {
        let candidate = res.join("standalone");
        if candidate.join("server.js").is_file() {
            return Ok(candidate);
        }
    }

    if let Some(exe) = exe_dir {
        let candidate = exe.join("standalone");
        if candidate.join("server.js").is_file() {
            return Ok(candidate);
        }
    }

    if let Some(repo) = dev_repo_root {
        let candidate = repo.join(".next").join("standalone");
        if candidate.join("server.js").is_file() {
            return Ok(candidate);
        }
    }

    Err("未找到 standalone/server.js，请先构建或检查安装包资源目录。".to_string())
}

pub fn resolve_data_dir(
    explicit_data_dir: Option<&Path>,
    exe_dir: Option<&Path>,
    appdata_dir: Option<&Path>,
    tauri_app_data_dir: Option<&Path>,
) -> PathBuf {
    if let Some(dir) = explicit_data_dir {
        return dir.to_path_buf();
    }

    if let Some(exe) = exe_dir {
        let user_data = exe.join("user-data");
        if exe.join("portable").exists() || user_data.exists() {
            return user_data;
        }
    }

    if cfg!(windows) {
        if let Some(appdata) = appdata_dir {
            return appdata.join("vnweb");
        }
    }

    if let Some(tauri_dir) = tauri_app_data_dir {
        return tauri_dir.to_path_buf();
    }

    exe_dir
        .map(|exe| exe.join("user-data"))
        .unwrap_or_else(|| PathBuf::from("user-data"))
}

pub fn resolve_node_bin(
    explicit_node: Option<&Path>,
    resource_dir: Option<&Path>,
    exe_dir: Option<&Path>,
) -> PathBuf {
    if let Some(node) = explicit_node {
        return node.to_path_buf();
    }

    if let Some(res) = resource_dir {
        let candidate = res.join("runtime").join("node.exe");
        if candidate.is_file() {
            return candidate;
        }
    }

    if let Some(exe) = exe_dir {
        let candidate = exe.join("runtime").join("node.exe");
        if candidate.is_file() {
            return candidate;
        }
    }

    PathBuf::from("node")
}

pub fn resolve_runtime_paths(app: &AppHandle) -> Result<RuntimePaths, String> {
    let exe_dir = env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(Path::to_path_buf));
    let resource_dir = app.path().resource_dir().ok();
    let tauri_app_data_dir = app.path().app_data_dir().ok();
    let dev_repo_root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(Path::parent);

    let explicit_app_dir = non_empty_env("VNWEB_APP_DIR").map(PathBuf::from);
    let explicit_data_dir = non_empty_env("VNWEB_DATA_DIR").map(PathBuf::from);
    let explicit_node = non_empty_env("VNWEB_NODE_PATH").map(PathBuf::from);
    let appdata_dir = non_empty_env("APPDATA").map(PathBuf::from);

    let app_dir = resolve_app_dir(
        explicit_app_dir.as_deref(),
        resource_dir.as_deref(),
        exe_dir.as_deref(),
        dev_repo_root,
    )?;

    let data_dir = resolve_data_dir(
        explicit_data_dir.as_deref(),
        exe_dir.as_deref(),
        appdata_dir.as_deref(),
        tauri_app_data_dir.as_deref(),
    );

    let node_bin = resolve_node_bin(
        explicit_node.as_deref(),
        resource_dir.as_deref(),
        exe_dir.as_deref(),
    );

    let log_file = data_dir.join("logs").join("desktop-server.log");

    Ok(RuntimePaths {
        app_dir,
        data_dir,
        node_bin,
        log_file,
    })
}

pub fn open_url_in_browser(url: &str) -> Result<(), String> {
    #[cfg(windows)]
    {
        Command::new("cmd")
            .args(["/C", "start", "", url])
            .creation_flags(CREATE_NO_WINDOW)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("打开浏览器失败: {e}"))?;
        Ok(())
    }

    #[cfg(not(windows))]
    {
        Command::new("xdg-open")
            .arg(url)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("打开浏览器失败: {e}"))?;
        Ok(())
    }
}

pub fn open_dir_in_explorer(dir: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| format!("创建数据目录失败: {e}"))?;

    #[cfg(windows)]
    {
        Command::new("explorer.exe")
            .arg(dir)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| format!("打开资源管理器失败: {e}"))?;
        Ok(())
    }

    #[cfg(not(windows))]
    {
        open_url_in_browser(&dir.to_string_lossy())
    }
}

pub fn read_native_title_bar_setting(data_dir: &Path) -> bool {
    let appearance_path = data_dir
        .join("data")
        .join("settings")
        .join("appearance.json");
    let Ok(content) = std::fs::read_to_string(appearance_path) else {
        return true;
    };
    let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&content) else {
        return true;
    };

    parsed
        .get("layout")
        .and_then(|layout| layout.get("nativeTitleBar"))
        .and_then(|value| value.as_bool())
        .unwrap_or(true)
}

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupSplashConfig {
    pub enabled: bool,
    pub media_type: String,
    pub media_file: Option<String>,
    pub media_width: Option<u32>,
    pub media_height: Option<u32>,
    pub match_media_window_size: bool,
    pub duration_ms: u64,
    pub muted: bool,
    pub skippable: bool,
}

pub const DEFAULT_WINDOW_WIDTH: f64 = 1280.0;
pub const DEFAULT_WINDOW_HEIGHT: f64 = 820.0;
pub const MIN_WINDOW_WIDTH: f64 = 960.0;
pub const MIN_WINDOW_HEIGHT: f64 = 640.0;
const MAX_STARTUP_MEDIA_DIMENSION: u64 = 16_384;

impl StartupSplashConfig {
    pub fn disabled() -> Self {
        Self {
            enabled: false,
            media_type: "none".to_string(),
            media_file: None,
            media_width: None,
            media_height: None,
            match_media_window_size: true,
            duration_ms: 2000,
            muted: false,
            skippable: true,
        }
    }
}

fn parse_media_dimension(value: Option<&serde_json::Value>) -> Option<u32> {
    let raw = value?.as_u64()?;
    if (1..=MAX_STARTUP_MEDIA_DIMENSION).contains(&raw) {
        u32::try_from(raw).ok()
    } else {
        None
    }
}

fn parse_startup_slot_config(
    data_dir: &Path,
    media_type: &str,
    slot: &serde_json::Value,
) -> StartupSplashConfig {
    if media_type != "image" && media_type != "video" {
        return StartupSplashConfig::disabled();
    }

    let raw_path = slot
        .get("mediaPath")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .trim();
    let clean_path = raw_path.split(['?', '#']).next().unwrap_or("").trim();
    let Some(file_name) = clean_path.strip_prefix("/assets/startup/") else {
        return StartupSplashConfig::disabled();
    };
    if !crate::splash::is_safe_single_filename(file_name) {
        return StartupSplashConfig::disabled();
    }

    let media_path = data_dir.join("assets").join("startup").join(file_name);
    if !media_path.is_file() {
        return StartupSplashConfig::disabled();
    }

    let (media_width, media_height) = match (
        parse_media_dimension(slot.get("mediaWidth")),
        parse_media_dimension(slot.get("mediaHeight")),
    ) {
        (Some(w), Some(h)) => (Some(w), Some(h)),
        _ => (None, None),
    };
    let match_media_window_size = slot
        .get("matchMediaWindowSize")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    let duration_ms = slot
        .get("durationMs")
        .and_then(|v| v.as_u64())
        .unwrap_or(2000)
        .clamp(500, 10_000);
    let muted = if media_type == "video" {
        slot.get("muted").and_then(|v| v.as_bool()).unwrap_or(false)
    } else {
        false
    };
    let skippable = slot
        .get("skippable")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);

    StartupSplashConfig {
        enabled: true,
        media_type: media_type.to_string(),
        media_file: Some(file_name.to_string()),
        media_width,
        media_height,
        match_media_window_size,
        duration_ms,
        muted,
        skippable,
    }
}

pub fn read_startup_splash_config(data_dir: &Path) -> StartupSplashConfig {
    let appearance_path = data_dir
        .join("data")
        .join("settings")
        .join("appearance.json");
    let Ok(content) = std::fs::read_to_string(appearance_path) else {
        return StartupSplashConfig::disabled();
    };
    let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&content) else {
        return StartupSplashConfig::disabled();
    };
    let Some(startup) = parsed.get("startup") else {
        return StartupSplashConfig::disabled();
    };

    let enabled = startup
        .get("enabled")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    if !enabled {
        return StartupSplashConfig::disabled();
    }

    if startup.get("image").is_some() || startup.get("video").is_some() {
        let active_type = startup
            .get("activeType")
            .and_then(|v| v.as_str())
            .unwrap_or("image");
        if active_type != "image" && active_type != "video" {
            return StartupSplashConfig::disabled();
        }
        let Some(slot) = startup.get(active_type).filter(|v| v.is_object()) else {
            return StartupSplashConfig::disabled();
        };
        return parse_startup_slot_config(data_dir, active_type, slot);
    }

    let media_type = startup
        .get("mediaType")
        .and_then(|v| v.as_str())
        .unwrap_or("none");
    parse_startup_slot_config(data_dir, media_type, startup)
}

pub fn calculate_startup_window_size(
    startup: &StartupSplashConfig,
    work_area_logical: Option<(f64, f64)>,
) -> (f64, f64) {
    if !startup.enabled || !startup.match_media_window_size {
        return (DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT);
    }

    let (Some(mw), Some(mh)) = (startup.media_width, startup.media_height) else {
        return (DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT);
    };
    if mw == 0 || mh == 0 {
        return (DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT);
    }

    let (work_w, work_h) = match work_area_logical {
        Some((w, h)) if w.is_finite() && h.is_finite() && w > 0.0 && h > 0.0 => (w, h),
        _ => (1920.0, 1040.0),
    };

    let min_w = MIN_WINDOW_WIDTH.min(work_w);
    let min_h = MIN_WINDOW_HEIGHT.min(work_h);
    let max_w = (work_w * 0.92).max(min_w).min(work_w);
    let max_h = (work_h * 0.92).max(min_h).min(work_h);

    let mut w = f64::from(mw);
    let mut h = f64::from(mh);

    if w > max_w || h > max_h {
        let scale = (max_w / w).min(max_h / h);
        w *= scale;
        h *= scale;
    }

    if w < min_w || h < min_h {
        let scale = (min_w / w).max(min_h / h).min(max_w / w).min(max_h / h);
        w *= scale;
        h *= scale;
    }

    (w.clamp(min_w, max_w).round(), h.clamp(min_h, max_h).round())
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
        let dir = env::temp_dir().join(format!("vnweb-desktop-paths-{label}-{nanos}"));
        fs::create_dir_all(&dir).expect("create temp dir");
        dir
    }

    #[test]
    fn resolves_data_dir_with_expected_priority() {
        let exe_dir = make_temp_dir("exe");
        let appdata = PathBuf::from("C:\\Users\\Demo\\AppData\\Roaming");
        let tauri_dir = PathBuf::from("C:\\Tauri\\vnweb");

        let explicit = PathBuf::from("E:\\vnweb-data");
        assert_eq!(
            resolve_data_dir(
                Some(&explicit),
                Some(&exe_dir),
                Some(&appdata),
                Some(&tauri_dir)
            ),
            explicit
        );

        let default_resolved =
            resolve_data_dir(None, Some(&exe_dir), Some(&appdata), Some(&tauri_dir));
        if cfg!(windows) {
            assert_eq!(default_resolved, appdata.join("vnweb"));
        } else {
            assert_eq!(default_resolved, tauri_dir);
        }

        fs::write(exe_dir.join("portable"), b"").expect("portable");
        assert_eq!(
            resolve_data_dir(None, Some(&exe_dir), Some(&appdata), Some(&tauri_dir)),
            exe_dir.join("user-data")
        );

        let _ = fs::remove_dir_all(&exe_dir);
    }

    #[test]
    fn resolves_app_dir_from_resource_or_exe_standalone() {
        let res_dir = make_temp_dir("res");
        let standalone = res_dir.join("standalone");
        fs::create_dir_all(&standalone).expect("standalone");
        fs::write(standalone.join("server.js"), b"// mock").expect("server.js");

        let resolved = resolve_app_dir(None, Some(&res_dir), None, None).expect("resolved");
        assert_eq!(resolved, standalone);

        let _ = fs::remove_dir_all(&res_dir);
    }

    #[test]
    fn reads_native_title_bar_setting_with_safe_fallback() {
        let data_dir = make_temp_dir("native-title-bar");
        assert!(read_native_title_bar_setting(&data_dir));

        let settings_dir = data_dir.join("data").join("settings");
        fs::create_dir_all(&settings_dir).expect("settings dir");
        let appearance_path = settings_dir.join("appearance.json");

        fs::write(
            &appearance_path,
            br#"{"layout":{"nativeTitleBar":false}}"#,
        )
        .expect("write false");
        assert!(!read_native_title_bar_setting(&data_dir));

        fs::write(
            &appearance_path,
            br#"{"layout":{"nativeTitleBar":true}}"#,
        )
        .expect("write true");
        assert!(read_native_title_bar_setting(&data_dir));

        fs::write(&appearance_path, b"{invalid json").expect("write invalid");
        assert!(read_native_title_bar_setting(&data_dir));

        let _ = fs::remove_dir_all(&data_dir);
    }

    #[test]
    fn reads_startup_splash_config_with_validation() {
        let data_dir = make_temp_dir("startup-splash");
        assert_eq!(
            read_startup_splash_config(&data_dir),
            StartupSplashConfig::disabled()
        );

        let settings_dir = data_dir.join("data").join("settings");
        let startup_dir = data_dir.join("assets").join("startup");
        fs::create_dir_all(&settings_dir).expect("settings dir");
        fs::create_dir_all(&startup_dir).expect("startup dir");
        fs::write(startup_dir.join("intro.png"), b"png").expect("img");
        fs::write(startup_dir.join("intro.mp4"), b"mp4").expect("mp4");

        let appearance_path = settings_dir.join("appearance.json");
        fs::write(
            &appearance_path,
            br#"{"startup":{"enabled":false,"mediaType":"image","mediaPath":"/assets/startup/intro.png"}}"#,
        )
        .expect("write disabled");
        assert!(!read_startup_splash_config(&data_dir).enabled);

        fs::write(
            &appearance_path,
            br#"{"startup":{"enabled":true,"mediaType":"image","mediaPath":"/assets/startup/intro.png","durationMs":12000,"muted":true,"skippable":false}}"#,
        )
        .expect("write valid image");
        let image_cfg = read_startup_splash_config(&data_dir);
        assert!(image_cfg.enabled);
        assert_eq!(image_cfg.media_type, "image");
        assert_eq!(image_cfg.media_file.as_deref(), Some("intro.png"));
        assert_eq!(image_cfg.duration_ms, 10_000);
        assert!(!image_cfg.muted);
        assert!(!image_cfg.skippable);

        fs::write(
            &appearance_path,
            br#"{"startup":{"enabled":true,"mediaType":"video","mediaPath":"/assets/startup/intro.mp4?v=1","muted":true}}"#,
        )
        .expect("write valid video");
        let video_cfg = read_startup_splash_config(&data_dir);
        assert!(video_cfg.enabled);
        assert_eq!(video_cfg.media_type, "video");
        assert_eq!(video_cfg.media_file.as_deref(), Some("intro.mp4"));
        assert!(video_cfg.muted);

        fs::write(
            &appearance_path,
            br#"{"startup":{"enabled":true,"mediaType":"image","mediaPath":"/assets/startup/../secret.png"}}"#,
        )
        .expect("write traversal");
        assert!(!read_startup_splash_config(&data_dir).enabled);

        fs::write(
            &appearance_path,
            br#"{"startup":{"enabled":true,"mediaType":"video","mediaPath":"/assets/startup/missing.mp4"}}"#,
        )
        .expect("write missing file");
        assert!(!read_startup_splash_config(&data_dir).enabled);

        let _ = fs::remove_dir_all(&data_dir);
    }

    #[test]
    fn reads_startup_dimensions_chinese_name_and_calculates_window_size() {
        let data_dir = make_temp_dir("startup-window-size");
        let settings_dir = data_dir.join("data").join("settings");
        let startup_dir = data_dir.join("assets").join("startup");
        fs::create_dir_all(&settings_dir).expect("settings dir");
        fs::create_dir_all(&startup_dir).expect("startup dir");
        fs::write(startup_dir.join("魔女 开幕.mp4"), b"mp4").expect("mp4");

        let appearance_path = settings_dir.join("appearance.json");
        fs::write(
            &appearance_path,
            r#"{"startup":{"enabled":true,"mediaType":"video","mediaPath":"/assets/startup/魔女 开幕.mp4?v=1","mediaWidth":1280,"mediaHeight":720,"matchMediaWindowSize":true}}"#,
        )
        .expect("write startup json");

        let cfg = read_startup_splash_config(&data_dir);
        assert!(cfg.enabled);
        assert_eq!(cfg.media_file.as_deref(), Some("魔女 开幕.mp4"));
        assert_eq!(cfg.media_width, Some(1280));
        assert_eq!(cfg.media_height, Some(720));
        assert!(cfg.match_media_window_size);

        assert_eq!(
            calculate_startup_window_size(&cfg, Some((1920.0, 1040.0))),
            (1280.0, 720.0)
        );

        let full_hd = StartupSplashConfig {
            media_width: Some(1920),
            media_height: Some(1080),
            ..cfg.clone()
        };
        assert_eq!(
            calculate_startup_window_size(&full_hd, Some((1920.0, 1040.0))),
            (1701.0, 957.0)
        );
        assert_eq!(
            calculate_startup_window_size(&full_hd, Some((2560.0, 1400.0))),
            (1920.0, 1080.0)
        );

        let small_hd = StartupSplashConfig {
            media_width: Some(640),
            media_height: Some(360),
            ..cfg.clone()
        };
        assert_eq!(
            calculate_startup_window_size(&small_hd, Some((1920.0, 1040.0))),
            (1138.0, 640.0)
        );

        let portrait = StartupSplashConfig {
            media_width: Some(1080),
            media_height: Some(1920),
            ..cfg.clone()
        };
        let (pw, ph) = calculate_startup_window_size(&portrait, Some((1920.0, 1040.0)));
        assert!((MIN_WINDOW_WIDTH..=1920.0 * 0.92 + 1.0).contains(&pw));
        assert!((MIN_WINDOW_HEIGHT..=1040.0 * 0.92 + 1.0).contains(&ph));

        let toggled_off = StartupSplashConfig {
            match_media_window_size: false,
            ..cfg.clone()
        };
        assert_eq!(
            calculate_startup_window_size(&toggled_off, Some((1920.0, 1040.0))),
            (DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT)
        );
        assert_eq!(
            calculate_startup_window_size(&StartupSplashConfig::disabled(), Some((1920.0, 1040.0))),
            (DEFAULT_WINDOW_WIDTH, DEFAULT_WINDOW_HEIGHT)
        );

        let _ = fs::remove_dir_all(&data_dir);
    }

    #[test]
    fn reads_dual_image_and_video_startup_configs_independently() {
        let data_dir = make_temp_dir("startup-dual-slots");
        let settings_dir = data_dir.join("data").join("settings");
        let startup_dir = data_dir.join("assets").join("startup");
        fs::create_dir_all(&settings_dir).expect("settings dir");
        fs::create_dir_all(&startup_dir).expect("startup dir");
        fs::write(startup_dir.join("cover.png"), b"png").expect("png");
        fs::write(startup_dir.join("intro.mp4"), b"mp4").expect("mp4");

        let appearance_path = settings_dir.join("appearance.json");
        fs::write(
            &appearance_path,
            r#"{
                "startup": {
                    "enabled": true,
                    "activeType": "image",
                    "image": {
                        "mediaPath": "/assets/startup/cover.png?v=1",
                        "mediaWidth": 1600,
                        "mediaHeight": 900,
                        "matchMediaWindowSize": false,
                        "durationMs": 3200,
                        "skippable": true
                    },
                    "video": {
                        "mediaPath": "/assets/startup/intro.mp4?v=2",
                        "mediaWidth": 1920,
                        "mediaHeight": 1080,
                        "matchMediaWindowSize": true,
                        "muted": true,
                        "skippable": false
                    }
                }
            }"#,
        )
        .expect("write image active config");

        let img_cfg = read_startup_splash_config(&data_dir);
        assert!(img_cfg.enabled);
        assert_eq!(img_cfg.media_type, "image");
        assert_eq!(img_cfg.media_file.as_deref(), Some("cover.png"));
        assert_eq!(img_cfg.media_width, Some(1600));
        assert_eq!(img_cfg.media_height, Some(900));
        assert!(!img_cfg.match_media_window_size);
        assert_eq!(img_cfg.duration_ms, 3200);
        assert!(!img_cfg.muted);
        assert!(img_cfg.skippable);

        fs::write(
            &appearance_path,
            r#"{
                "startup": {
                    "enabled": true,
                    "activeType": "video",
                    "image": {
                        "mediaPath": "/assets/startup/cover.png?v=1",
                        "durationMs": 3200
                    },
                    "video": {
                        "mediaPath": "/assets/startup/intro.mp4?v=2",
                        "mediaWidth": 1920,
                        "mediaHeight": 1080,
                        "matchMediaWindowSize": true,
                        "muted": true,
                        "skippable": false
                    }
                }
            }"#,
        )
        .expect("write video active config");

        let vid_cfg = read_startup_splash_config(&data_dir);
        assert!(vid_cfg.enabled);
        assert_eq!(vid_cfg.media_type, "video");
        assert_eq!(vid_cfg.media_file.as_deref(), Some("intro.mp4"));
        assert_eq!(vid_cfg.media_width, Some(1920));
        assert_eq!(vid_cfg.media_height, Some(1080));
        assert!(vid_cfg.match_media_window_size);
        assert!(vid_cfg.muted);
        assert!(!vid_cfg.skippable);

        fs::write(
            &appearance_path,
            r#"{
                "startup": {
                    "enabled": true,
                    "activeType": "image",
                    "image": { "mediaPath": "" },
                    "video": { "mediaPath": "/assets/startup/intro.mp4?v=2" }
                }
            }"#,
        )
        .expect("write empty active slot");
        assert!(!read_startup_splash_config(&data_dir).enabled);

        let _ = fs::remove_dir_all(&data_dir);
    }
}
