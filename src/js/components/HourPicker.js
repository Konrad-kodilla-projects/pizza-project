import { BaseWidget } from './BaseWidget.js';
import { settings, select } from '../settings.js';
import { utils } from '../utils.js';

export class HourPicker extends BaseWidget {
  constructor(wrapper, initValue) {
    super(wrapper, settings.hours.open);
    console.log('TCL: HourPicker -> constructor -> initValue', initValue);

    const { input, output } = select.widgets.hourPicker;
    this.dom.input = this.dom.wrapper.querySelector(input);
    this.dom.output = this.dom.wrapper.querySelector(output);
    this.value = initValue || settings.hours.open;

    this.initPlugin();
  }

  initPlugin() {
    // eslint-disable-next-line no-undef
    rangeSlider.create(this.dom.input);
    this.dom.input.addEventListener('input', () => {
      this.value = this.dom.input.value;
    });
  }

  parseValue(val) {
    return utils.numberToHour(val);
  }

  isValid() {
    return true;
  }

  renderValue() {
    this.dom.output.innerHTML = this.value;
  }
}
