import { Proxy, Hooks } from 'ajax-hook';

declare global {
    namespace ah {
        function proxy(proxy: Proxy): XMLHttpRequest;
        function hook(hook: Hooks): XMLHttpRequest;
    }
}

declare interface ModuleItem {
    name: string
    title: string
    content: string
    type: string
    is_top: boolean
}