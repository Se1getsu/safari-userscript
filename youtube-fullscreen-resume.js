// ==UserScript==
// @name         YouTube Fullscreen Resume
// @description  YouTube 全画面解除後の再生継続を行う
// @author       Se1getsu
// @version      1.0.0
// @match        https://m.youtube.com/watch*
// @grant        none
// @inject-into  content
// ==/UserScript==

(function () {
    'use strict';
    // 全画面解除から何ミリ秒の間 video.play() を呼び続けるか
    const TIMEOUT_DURATION = 800;
    // 何ミリ秒ごとに video.play() を呼ぶか
    const INTERVAL_DELAY = 16;

    // 全画面が解除される直前に動画が再生中だったかどうか
    let wasPlaying = false;
    // 再再生のインターバル
    let intervalId = null;
    let intervalCount = 0;

    function attachVideoListeners(video) {
        // 全画面に入った
        video.addEventListener('webkitbeginfullscreen', () => {
            wasPlaying = !video.paused;
        });

        // 全画面中に停止ボタンが押された
        video.addEventListener('pause', () => {
            if (video.webkitDisplayingFullscreen) {
                wasPlaying = false;
            }
        });

        // 全画面中に再生ボタンが押された
        video.addEventListener('play', () => {
            if (video.webkitDisplayingFullscreen) {
                wasPlaying = true;
            }
        });

        // 全画面が解除される時
        video.addEventListener('webkitendfullscreen', () => {
            if (intervalId != null) clearInterval(intervalId);
            if (wasPlaying) {
                intervalCount = 0;
                intervalId = setInterval(() => {
                    if (video.paused) {
                        console.log('[DEBUG] 動画を再再生します', intervalCount);
                        video.play();
                    }
                    if (++intervalCount >= TIMEOUT_DURATION / INTERVAL_DELAY) {
                        clearInterval(intervalId);
                    }
                }, INTERVAL_DELAY);
            }
        });
    }

    // MutationObserverを利用して、DOMに追加されたvideo要素に対し上記リスナーを設定
    const observer = new MutationObserver(() => {
        const video = document.querySelector('video');
        if (video && !video._attachedListeners) {
            attachVideoListeners(video);
            video._attachedListeners = true;
            console.log('[INFO] Attached iOS fullscreen listeners to video');
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
