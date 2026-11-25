mod paths;
mod file_dialogs;
mod server;
mod splash;
mod tray;

use std::env;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use tauri::webview::NewWindowResponse;
use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};

use crate::paths::{
    calculate_startup_window_size, open_url_in_browser, read_native_title_bar_setting,
    read_startup_splash_config, resolve_runtime_paths, RuntimePaths, MIN_WINDOW_HEIGHT,
    MIN_WINDOW_WIDTH,
};
use crate::server::ServerManager;

pub struct AppState {
    pub server: ServerManager,
    pub paths: RuntimePaths,
    pub is_quitting: AtomicBool,
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
        .invoke_handler(tauri::generate_handler![file_dialogs::save_export, file_dialogs::pick_game_path])
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

            tray::setup_tray(app.handle())?;

            let use_dev_url =
                cfg!(debug_assertions) && env::var_os("VNWEB_FORCE_SIDECAR").is_none();

            let initial_url = if use_dev_url {
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
            let is_desktop_sidecar = !use_dev_url;
            let init_script = format!(
                "(function(){{var p=location.protocol,h=location.hostname;if(p==='tauri:'||h==='tauri.localhost'){{window.__VNWEB_STARTUP_CONFIG__={startup_json};window.__VNWEB_NATIVE_TITLE_BAR__={native_title_bar};}}else if({is_desktop_sidecar}&&h==='127.0.0.1'){{window.__VNWEB_DESKTOP_SPLASH_DONE__=true;}}}})();"
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
                .title("vnweb")
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

            if !use_dev_url {
                let app_handle = app.handle().clone();
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
                                        let url_json = serde_json::to_string(&url)
                                            .unwrap_or_else(|_| "\"http://127.0.0.1:8999\"".to_string());
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
