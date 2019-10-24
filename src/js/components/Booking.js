import { templates, select } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';
import { DatePicker } from './DatePicker.js';

export class Booking{
  constructor(elem){
    this.render(elem);
    this.initWidgets();
  }

  render(elem){
    const {peopleAmount, hoursAmount} = select.booking;
    const {datePicker} = select.widgets;
    this.dom = {
      wrapper: elem.innerHTML = templates.bookingWidget(),
      peopleAmount: elem.querySelector(peopleAmount),
      hoursAmount: elem.querySelector(hoursAmount),
      datePicker: elem.querySelector(datePicker.wrapper)
    };
  }

  initWidgets(){
    this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
    this.datePicker = new DatePicker(this.dom.datePicker);
  }
}