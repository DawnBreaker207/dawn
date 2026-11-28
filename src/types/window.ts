import type { StageEngine } from '@/lib/simulator/stage';
import type { WeatherMode } from '@/scripts/core/weather';

declare global {
  interface Window {
    /** Aborts the previous lesson workbench's listeners when a view transition re-inits the page. */
    __sim_wb_controller?: AbortController;
    /** The running stage engine of the current lab page (handy from the browser console). */
    __ap_native?: StageEngine;
    /** Listeners from the previous page init, kept so a view-transition re-init can remove them first. */
    __dawn_weather_toggle_listener?: () => void;
    __dawn_weather_set_listener?: (e: CustomEvent<{ mode: WeatherMode }>) => void;
    __dawn_rain_toggle_listener?: () => void;
    __dawn_thock_listener?: (e: KeyboardEvent) => void;
    /** Hooks set by the page scripts: the easter-egg trigger and a once-only guard for the fullscreen key. */
    __dawn_easter_egg?: () => void;
    __dawn_fullscreen_bound?: boolean;
    /** Safari's prefixed AudioContext. */
    webkitAudioContext?: typeof AudioContext;
  }
}
