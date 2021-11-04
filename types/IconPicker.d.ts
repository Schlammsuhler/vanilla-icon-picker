declare class IconPicker {
    constructor(el: String | HTMLElement, options: IconPicker.Options);

    on(event: IconPicker.EventType, callback?: Function): IconPicker;

    off(event: IconPicker.EventType, callback?: Function): IconPicker;

    open(): void;

    hide(): void;

    isOpen(): boolean;

    detroy(deleteInstance?: boolean): void;
}

declare namespace IconPicker {
    interface Options {
        theme: Theme,
        closeOnSelect?: boolean,
        i18n?: {
            'input:placeholder'?: string,
            'text:title'?: string,
            'text:empty'?: string,
            'btn:save'?: string
        }
    }

    type Theme = 'default' | 'bootstrap-5';

    type EventType = 'select' | 'save' | 'show' | 'hide';
}


