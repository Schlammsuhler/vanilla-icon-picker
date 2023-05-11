import * as _ from "./utlis/utils";
import template from "./template";
import {resolveCollection} from "./utlis/collections";

export default class IconPicker {
    static DEFAULT_OPTIONS = {
        theme: 'default',
        closeOnSelect: true,
        defaultValue: null,
        iconSource: [],
        i18n: {
            'input:placeholder': 'Search icon…',

            'text:title': 'Select icon',
            'text:empty': 'No results found…',

            'btn:save': 'Save'
        }
    }

    _eventListener = {
        select: [],
        save: [],
        show: [],
        hide: []
    };

    /**
     *
     * @param {string | HTMLElement} el
     * @param {Object} options
     */
    constructor(el, options = {}) {
        this.options = _.mergeDeep(IconPicker.DEFAULT_OPTIONS, options);
        this.element = el;

        // Initialize icon picker
        this._preBuild();

        if (this.element) {
            this._binEvents();
            this._renderdIcons();
            this._createModal();
        } else {
            this._catchError('iconSourceMissing');
        }
    }

    _preBuild() {
        this.element = _.resolveElement(this.element);
        this.root = template(this.options);

        if (!Array.isArray(this.options.iconSource) && this.options.iconSource.length > 0) {
            this.options.iconSource = [this.options.iconSource];
        }
    }

    _binEvents() {
        const {options, root, element} = this;
        let iconsElements = [];

        this._eventBindings = [
            _.addEvent(element, 'click', () => this.show()),
            _.addEvent(root.close, 'click', () => this.hide()),
            _.addEvent(root.modal, 'click', (evt) => {
                if (evt.target === root.modal) {
                    this.hide();
                }
            }),
            _.addEvent(root.search, 'keyup', _.debounce((evt) => {
                const iconsResult = this.availableIcons.filter((obj) => obj.value.includes(evt.target.value.toLowerCase()));

                if (!iconsElements.length) {
                    iconsElements = document.querySelectorAll('.icon-element');
                }

                iconsElements.forEach((iconElement) => {
                    iconElement.hidden = true;

                    iconsResult.forEach((result) => {
                        if (iconElement.classList.contains(result.value)) {
                            iconElement.hidden = false;
                        }
                    });
                });

                const emptyElement = root.content.querySelector('.is-empty');

                if (iconsResult.length > 0) {
                    if (emptyElement) {
                        emptyElement.remove();
                    }
                } else {
                    if (!emptyElement) {
                        root.content.appendChild(_.stringToHTML(`<div class="is-empty">${options.i18n['text:empty']}</div>`));
                    }
                }
            }, 250))
        ];

        if (!options.closeOnSelect) {
            this._eventBindings.push(_.addEvent(root.save, 'click', () => this._onSave()));
        }
    }

    /**
     * Hide icon picker modal
     */
    hide() {
        if (this.isOpen()) {
            this.root.modal.classList.remove('is-visible');
            this._emit('hide');

            return this;
        }

        return false
    }

    /**
     * Show icon picker modal
     */
    show() {
        if (!this.isOpen()) {
            this.root.modal.classList.add('is-visible');
            this._emit('show');

            return this;
        }

        return false
    }

    /**
     * Check if modal is open
     * @returns {boolean}
     */
    isOpen() {
        return this.root.modal.classList.contains('is-visible');
    }

    /**
     * Destroy icon picker instance and detach all events listeners
     * @param {boolean} deleteInstance
     */
    destroy(deleteInstance = true) {
        this.initialized = false;

        // Remove elements events
        this._eventBindings.forEach(args => _.removeEvent(...args));

        // Delete instance
        if (deleteInstance) {
            Object.keys(this).forEach((key) => delete this[key]);
        }
    }

    _emit(event, ...args) {
        this._eventListener[event].forEach(cb => cb(...args, this));
    }

    on(event, callback) {
        if (this._eventListener[event] !== undefined) {
            this._eventListener[event].push(callback);
            return this;
        }

        return false
    }

    off(event, callback) {
        const callBacks = (this._eventListener[event] || []);
        const index = callBacks.indexOf(callback);

        if (~index) {
            callBacks.splice(index, 1);
        }

        return this;
    }

    _createModal() {
        document.body.appendChild(this.root.modal);

        this.initialized = true;
    }

    _onSave() {
        this._setValueInput()

        this.hide();
        this._emit('save', this.emitValues);
    }

  /**
   * Generate icons elements
   * @private
   */
  _renderdIcons() {
    const { root, options } = this;
    let previousSelectedIcon = null;
    let currentlySelectElement = null;
    this.availableIcons = [];

    root.content.innerHTML = '';

    for (const library of this._getIcons()) {
      for (const key of library.icons) {
        const iconClass = library.prefix + key

        const iconTarget = document.createElement('button');
        iconTarget.title = key
        iconTarget.className = `icon-element ${key}`;
        iconTarget.dataset.value = iconClass

        const iconElement = document.createElement('i');
        iconElement.className = iconClass;

        iconTarget.append(iconElement)
        root.content.appendChild(iconTarget);

        this.availableIcons.push({ value: key, body: iconElement.outerHTML });

        // Icon click event
        iconTarget.addEventListener('click', (evt) => {
          if (this.currentlySelectName !== evt.currentTarget.firstChild.className) {
            evt.currentTarget.classList.add('is-selected');

            currentlySelectElement = evt.currentTarget;
            this.currentlySelectName = currentlySelectElement.dataset.value;
            this.SVGString = iconElement.outerHTML;

            this.emitValues = {
              name: key,
              value: this.currentlySelectName,
              svg: this.SVGString,
            }

            this._emit('select', this.emitValues);
          }

          if (previousSelectedIcon) {
            previousSelectedIcon.classList.remove('is-selected');
          }

          if (options.closeOnSelect) {
            this._onSave();
          }

          previousSelectedIcon = currentlySelectElement;
        });
      }
    }

    const value = options.defaultValue || this.element.value;
    if (value) {
      const defaultElement = root.content.querySelector(`[data-value="${value}"]`);
      if (defaultElement) {
        defaultElement.classList.add('is-selected');
        previousSelectedIcon = defaultElement;
        this.currentlySelectName = value;
      }
      if (!this.element.value) {
        this._setValueInput();
      }
    }
  }

  /**
   *
   * @returns {string}
   * @private
   */
  _getIcons() {
    return [{ "prefix": "fa-brands fa-", "icons": ["linkedin-in", "facebook-f", "youtube", "twitter"] }, { "prefix": "fa-duotone fa-", "icons": ["arrow-down-up-across-line", "house-building", "pen-ruler", "people-arrows", "laptop-code", "lightbulb", "sitemap", "book-open-cover", "lock", "gas-pump", "comments-question-check", "car-side", "plug", "angle-right", "escalator", "bullseye", "money-bill-wave", "chart-area", "charging-station", "person-running", "user-group", "folder-open", "headset", "map-location-dot", "chart-bar", "file-binary", "handshake", "circle-check", "compass-drafting", "universal-access", "crystal-ball", "scroll", "seedling", "boxes-packing", "shield-halved", "newspaper", "money-check-dollar", "puzzle-piece", "road", "chart-pie", "chart-line", "arrow-right", "screwdriver-wrench", "money-bill-transfer", "clipboard-check", "typewriter", "eye", "hand-holding-dollar", "phone", "rocket-launch", "person-digging", "arrow-left", "envelope", "meter-bolt", "circle-info", "car-building", "tablet-screen", "clock", "mobile-screen", "network-wired", "download", "mobile", "tower-broadcast", "bolt", "sun", "angle-down", "toolbox", "credit-card", "hand-holding-hand", "book-open-reader", "beer-mug", "paint-roller", "hotdog", "magnifying-glass", "tv", "megaphone", "user-headset", "cart-shopping-fast", "keynote", "xmark", "chalkboard-user", "cars", "tablet", "truck-moving", "trophy", "award", "building", "qrcode", "transformer-bolt", "angle-left", "right-left", "brush", "cards-blank", "print", "masks-theater", "notdef"] }, { "prefix": "fa-light fa-", "icons": ["arrow-down-up-across-line", "house-building", "pen-ruler", "people-arrows", "laptop-code", "lightbulb", "sitemap", "book-open-cover", "lock", "gas-pump", "comments-question-check", "car-side", "plug", "angle-right", "escalator", "bullseye", "money-bill-wave", "chart-area", "charging-station", "person-running", "user-group", "folder-open", "headset", "map-location-dot", "chart-bar", "file-binary", "handshake", "circle-check", "compass-drafting", "universal-access", "crystal-ball", "scroll", "seedling", "boxes-packing", "shield-halved", "newspaper", "money-check-dollar", "puzzle-piece", "road", "chart-pie", "chart-line", "arrow-right", "screwdriver-wrench", "money-bill-transfer", "clipboard-check", "typewriter", "eye", "hand-holding-dollar", "phone", "rocket-launch", "person-digging", "arrow-left", "envelope", "meter-bolt", "circle-info", "car-building", "tablet-screen", "clock", "mobile-screen", "network-wired", "download", "mobile", "tower-broadcast", "bolt", "sun", "angle-down", "toolbox", "credit-card", "hand-holding-hand", "book-open-reader", "beer-mug", "paint-roller", "hotdog", "magnifying-glass", "tv", "megaphone", "user-headset", "cart-shopping-fast", "keynote", "xmark", "chalkboard-user", "cars", "tablet", "truck-moving", "trophy", "award", "building", "qrcode", "transformer-bolt", "angle-left", "right-left", "brush", "cards-blank", "print", "masks-theater", "notdef"] }, { "prefix": "fa-solid fa-", "icons": ["arrow-down-up-across-line", "house-building", "pen-ruler", "people-arrows", "laptop-code", "lightbulb", "sitemap", "book-open-cover", "lock", "gas-pump", "comments-question-check", "car-side", "plug", "angle-right", "escalator", "bullseye", "money-bill-wave", "chart-area", "charging-station", "person-running", "user-group", "folder-open", "headset", "map-location-dot", "chart-bar", "file-binary", "handshake", "circle-check", "compass-drafting", "universal-access", "crystal-ball", "scroll", "seedling", "boxes-packing", "shield-halved", "newspaper", "money-check-dollar", "puzzle-piece", "road", "chart-pie", "chart-line", "arrow-right", "screwdriver-wrench", "money-bill-transfer", "clipboard-check", "typewriter", "eye", "hand-holding-dollar", "phone", "rocket-launch", "person-digging", "arrow-left", "envelope", "meter-bolt", "circle-info", "car-building", "tablet-screen", "clock", "mobile-screen", "network-wired", "download", "mobile", "tower-broadcast", "bolt", "sun", "angle-down", "toolbox", "credit-card", "hand-holding-hand", "book-open-reader", "beer-mug", "paint-roller", "hotdog", "magnifying-glass", "tv", "megaphone", "user-headset", "cart-shopping-fast", "keynote", "xmark", "chalkboard-user", "cars", "tablet", "truck-moving", "trophy", "award", "building", "qrcode", "transformer-bolt", "angle-left", "right-left", "brush", "cards-blank", "print", "masks-theater", "notdef"] }]
  }

    /**
     *
     * @param {string} exception
     * @private
     */
    _catchError(exception) {
        switch (exception) {
            case 'iconSourceMissing':
                throw Error('No icon source was found.');
                break;
        }
    }

    /**
     * Set value into input element
     * @param value
     * @private
     */
    _setValueInput(value = this.currentlySelectName) {
        const {element} = this;

        if (element instanceof HTMLInputElement && this.currentlySelectName) {
            element.value = value;
        }
    }
}
