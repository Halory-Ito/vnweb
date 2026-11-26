mod file_dialogs;
mod paths;
mod server;
mod splash;
mod tray;

use std::env;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};

use crate::paths::{
    calculate_startup_window_size, load_custom_app_icon, open_url_in_browser, read_app_settings,
    read_native_title_bar_setting, read_startup_splash_config, resolve_runtime_paths, RuntimePaths,
    MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH,
};
use crate::server::ServerManager;

pub struct AppState {
    pub server: ServerManager,
    pub paths: RuntimePaths,
    pub is_quitting: AtomicBool,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopRuntimeInfo {
    pub is_sidecar: bool,
    pub current_port: u16,
}

fn is_sidecar_mode() -> bool {
    !(cfg!(debug_assertions) && env::var_os("VNWEB_FORCE_SIDECAR").is_none())
}

#[tauri::command]
fn get_desktop_runtime_info(app: AppHandle) -> DesktopRuntimeInfo {
    let state = app.state::<AppState>();
    DesktopRuntimeInfo {
        is_sidecar: is_sidecar_mode(),
        current_port: state.server.current_port(),
    }
}

#[tauri::command]
fn sync_app_branding(app: AppHandle, window_title: Option<String>) -> Result<(), String> {
    let data_dir = app.state::<AppState>().paths.data_dir.clone();
    let app_settings = read_app_settings(&data_dir);
    let custom_icon = load_custom_app_icon(&data_dir, &app_settings);

    tray::apply_tray_branding(&app, &app_settings, custom_icon.clone())
        .map_err(|e| e.to_string())?;

    if let Some(window) = app.get_webview_window("main") {
        let title = window_title
            .as_deref()
            .map(str::trim)
            .filter(|t| !t.is_empty())
            .unwrap_or(&app_settings.name);
        let _ = window.set_title(title);
        if let Some(icon) = custom_icon.or_else(|| app.default_window_icon().cloned()) {
            let _ = window.set_icon(icon);
        }
    }

    Ok(())
}

#[tauri::command]
async fn restart_desktop_server(
    app: AppHandle,
    return_path: Option<String>,
) -> Result<u16, String> {
    if !is_sidecar_mode() {
        return Err("开发模式下不支持重启内嵌服务".to_string());
    }

    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let port = state.server.restart(&state.paths)?;
        let normalized_path = return_path
            .as_deref()
            .map(str::trim)
            .filter(|path| path.starts_with('/') && !path.starts_with("//"))
            .unwrap_or("/");
        let target_url = format!("http://127.0.0.1:{port}{normalized_path}");
        if let Some(window) = app.get_webview_window("main") {
            if let Ok(parsed) = target_url.parse() {
                let _ = window.navigate(parsed);
            }
        }
        Ok(port)
    })
    .await
    .map_err(|error| error.to_string())?
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn show_startup_error(window: &WebviewWindow, message: &str, log_path: &str) {
    let _ = window.set_decorations(true);
    let msg_json = serde_json::to_string(message).unwrap_or_else(|_| "\"启动失败\"".to_string());
    let log_json = serde_json::to_string(log_path).unwrap_or_else(|_| "\"\"".to_string());
    let script = format!(
        "window.__vnwebPendingError = {{ message: {msg_json}, logPath: {log_json} }}; if (window.__vnwebShowError) {{ window.__vnwebShowError({msg_json}, {log_json}); }}"
    );
    let _ = window.eval(&script);
}

fn update_startup_status(window: &WebviewWindow, step: u8, text: &str) {
    let text_json = serde_json::to_string(text).unwrap_or_else(|_| "\"\"".to_string());
    let script = format!(
        "window.__vnwebPendingStatus = [{step}, {text_json}]; if (window.__vnwebSetStatus) {{ window.__vnwebSetStatus({step}, {text_json}); }}"
    );
    let _ = window.eval(&script);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            file_dialogs::save_export,
            file_dialogs::pick_game_path,
            sync_app_branding,
            get_desktop_runtime_info,
            restart_desktop_server
        ])
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }))
        .register_uri_scheme_protocol("vnweb-splash", |ctx, request| {
            let data_dir = ctx.app_handle().state::<AppState>().paths.data_dir.clone();
            splash::handle_splash_protocol(&data_dir, request)
        })
        .setup(|app| {
            let paths = resolve_runtime_paths(app.handle())?;
            app.manage(AppState {
                server: ServerManager::default(),
                paths: paths.clone(),
                is_quitting: AtomicBool::new(false),
            });

            let app_settings = read_app_settings(&paths.data_dir);
            let custom_icon = load_custom_app_icon(&paths.data_dir, &app_settings);

            tray::setup_tray(app.handle(), &app_settings, custom_icon.clone())?;

            let is_desktop_sidecar = is_sidecar_mode();

            let initial_url = if !is_desktop_sidecar {
                WebviewUrl::External(
                    "http://localhost:3000"
                        .parse()
                        .expect("valid localhost dev URL"),
                )
            } else {
                WebviewUrl::App("index.html".into())
            };

            let native_title_bar = read_native_title_bar_setting(&paths.data_dir);
            let startup_config = read_startup_splash_config(&paths.data_dir);
            let startup_json =
                serde_json::to_string(&startup_config).unwrap_or_else(|_| "{}".to_string());
            let app_branding_json =
                serde_json::to_string(&app_settings).unwrap_or_else(|_| "{}".to_string());
            let init_script = format!(
                "(function(){{var p=location.protocol,h=location.hostname;if(p==='tauri:'||h==='tauri.localhost'){{window.__VNWEB_STARTUP_CONFIG__={startup_json};window.__VNWEB_NATIVE_TITLE_BAR__={native_title_bar};window.__VNWEB_APP_BRANDING__={app_branding_json};}}else if({is_desktop_sidecar}&&h==='127.0.0.1'){{window.__VNWEB_DESKTOP_SPLASH_DONE__=true;}}}})();"
            );
            let work_area_logical = app.primary_monitor().ok().flatten().map(|monitor| {
                let area = monitor.work_area();
                let scale = if monitor.scale_factor() > 0.0 {
                    monitor.scale_factor()
                } else {
                    1.0
                };
                (
                    f64::from(area.size.width) / scale,
                    f64::from(area.size.height) / scale,
                )
            });
            let (init_width, init_height) =
                calculate_startup_window_size(&startup_config, work_area_logical);

            let window = WebviewWindowBuilder::new(app, "main", initial_url)
                .title(&app_settings.name)
                .inner_size(init_width, init_height)
                .min_inner_size(MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT)
                .center()
                .resizable(true)
                .decorations(native_title_bar)
                .initialization_script(&init_script)
                .on_new_window(|url, _features| {
                    let scheme = url.scheme();
                    if scheme == "http" || scheme == "https" {
                        let _ = open_url_in_browser(url.as_str());
                    }
                    NewWindowResponse::Deny
                })
                .build()?;

            if let Some(icon) = custom_icon {
                let _ = window.set_icon(icon);
            }

            let app_for_close = app.handle().clone();
            window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let state = app_for_close.state::<AppState>();
                    if !state.is_quitting.load(Ordering::SeqCst) {
                        api.prevent_close();
                        if let Some(win) = app_for_close.get_webview_window("main") {
                            let _ = win.hide();
                        }
                    }
                }
            });

            if is_desktop_sidecar {
                let app_handle = app.handle().clone();
                let fallback_port = app_settings.port;
                std::thread::spawn(move || {
                    let state = app_handle.state::<AppState>();
                    let log_str = state.paths.log_file.to_string_lossy().into_owned();
                    if let Some(win) = app_handle.get_webview_window("main") {
                        update_startup_status(&win, 1, "正在启动本地服务");
                    }
                    match state.server.start(&state.paths) {
                        Ok(port) => {
                            if let Some(win) = app_handle.get_webview_window("main") {
                                update_startup_status(&win, 2, "正在初始化配置与数据库");
                            }
                            match state.server.wait_until_ready(
                                port,
                                &state.paths.log_file,
                                Duration::from_secs(30),
                            ) {
                                Ok(()) => {
                                    if let Some(win) = app_handle.get_webview_window("main") {
                                        let url = format!("http://127.0.0.1:{port}");
                                        let fallback_json = format!("\"http://127.0.0.1:{fallback_port}\"");
                                        let url_json = serde_json::to_string(&url)
                                            .unwrap_or(fallback_json);
                                        let script = format!(
                                            "window.__vnwebPendingReadyUrl = {url_json}; if (window.__vnwebServerReady) {{ window.__vnwebServerReady({url_json}); }}"
                                        );
                                        if win.eval(&script).is_err() {
                                            if let Ok(parsed) = url.parse() {
                                                let _ = win.navigate(parsed);
                                            }
                                        }
                                    }
                                }
                                Err(err) => {
                                    if let Some(win) = app_handle.get_webview_window("main") {
                                        show_startup_error(&win, &err, &log_str);
                                    }
                                }
                            }
                        }
                        Err(err) => {
                            if let Some(win) = app_handle.get_webview_window("main") {
                                show_startup_error(&win, &err, &log_str);
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                let state = app.state::<AppState>();
                state.is_quitting.store(true, Ordering::SeqCst);
                state.server.stop();
            }
        });
}
