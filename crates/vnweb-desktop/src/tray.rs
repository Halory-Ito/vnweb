use std::sync::atomic::Ordering;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};

use crate::paths::{open_dir_in_explorer, open_url_in_browser};
use crate::{show_main_window, AppState};

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "打开 vnweb", true, None::<&str>)?;
    let browser_item =
        MenuItem::with_id(app, "open-browser", "在浏览器中打开", true, None::<&str>)?;
    let data_dir_item = MenuItem::with_id(app, "open-data", "打开数据目录", true, None::<&str>)?;
    let restart_item =
        MenuItem::with_id(app, "restart-server", "重启本地服务", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出 vnweb", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_item,
            &browser_item,
            &data_dir_item,
            &restart_item,
            &separator,
            &quit_item,
        ],
    )?;

    let mut builder = TrayIconBuilder::with_id("vnweb-tray")
        .menu(&menu)
        .tooltip("vnweb")
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => show_main_window(app),
            "open-browser" => {
                let url = app.state::<AppState>().server.current_url();
                let _ = open_url_in_browser(&url);
            }
            "open-data" => {
                let data_dir = app.state::<AppState>().paths.data_dir.clone();
                let _ = open_dir_in_explorer(&data_dir);
            }
            "restart-server" => {
                let app_handle = app.clone();
                std::thread::spawn(move || {
                    let state = app_handle.state::<AppState>();
                    if let Ok(port) = state.server.restart(&state.paths) {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if let Ok(parsed) = format!("http://127.0.0.1:{port}").parse() {
                                let _ = window.navigate(parsed);
                            }
                        }
                    }
                });
            }
            "quit" => {
                let state = app.state::<AppState>();
                state.is_quitting.store(true, Ordering::SeqCst);
                state.server.stop();
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        builder = builder.icon(icon);
    }

    builder.build(app)?;
    Ok(())
}
