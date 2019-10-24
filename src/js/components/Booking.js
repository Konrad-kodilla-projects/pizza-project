import { templates, select } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';

export class Booking{
  constructor(elem){
    this.render(elem);
    this.initWidgets();
  }

  render(elem){
    const {peopleAmount, hoursAmount} = select.booking;
    this.dom = {
      wrapper: elem.innerHTML = templates.bookingWidget(),
      peopleAmount: elem.querySelector(peopleAmount),
      hoursAmount: elem.querySelector(hoursAmount)
    };
  }

  initWidgets(){
    this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
  }
}