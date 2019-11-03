import { templates, select } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';
import { DatePicker } from './DatePicker.js';
import { HourPicker } from './HourPicker.js';

export class Booking{
  constructor(elem){
    this.render(elem);
    this.initWidgets();
  }

  render(elem){
    const {peopleAmount, hoursAmount} = select.booking;
    const {datePicker, hourPicker} = select.widgets;
    this.dom = {
      wrapper: elem.innerHTML = templates.bookingWidget(),
      peopleAmount: elem.querySelector(peopleAmount),
      hoursAmount: elem.querySelector(hoursAmount),
      datePicker: elem.querySelector(datePicker.wrapper),
      hourPicker: elem.querySelector(hourPicker.wrapper)
    };
  }

  initWidgets(){
    this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
    this.datePicker = new DatePicker(this.dom.datePicker);
    this.hourPicker = new HourPicker(this.dom.hourPicker);
  }
}