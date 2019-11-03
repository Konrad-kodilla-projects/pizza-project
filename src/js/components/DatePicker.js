import { BaseWidget } from './BaseWidget.js';
import { utils } from '../utils.js';
import { select, settings } from '../settings.js';

export class DatePicker extends BaseWidget {
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));

    const {input} = select.widgets.datePicker;
    this.dom.input = this.dom.wrapper.querySelector(input);

    this.initPlugin();
  }

  initPlugin(){
    const {maxDaysInFuture: maxDays} = settings.datePicker;
    this.minDate = new Date(this.value);
    this.maxDate = utils.addDays(this.minDate, maxDays);

    // init plugin
    // eslint-disable-next-line no-undef
    flatpickr(this.dom.input, {
      maxDate: this.maxDate,
      minDate: this.minDate,
      defaultDate: this.minDate,
      disable: [
        function(date){
          return date.getDay() === 1;
        }
      ],
      locale: {
        'firstDayOfWeek': 1
      },
      onChange: function(dateStr) {
        this.value = dateStr;
      }
    });
  }

  parseValue(val){
    return val;
  }

  isValid(){
    return true;
  }

  renderValue(){}
}