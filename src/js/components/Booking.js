import { templates, select, settings, classNames } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';
import { DatePicker } from './DatePicker.js';
import { HourPicker } from './HourPicker.js';
import { utils } from '../utils.js';

export class Booking {
  constructor(elem) {
    this.render(elem);
    this.initWidgets();
    this.getData();
  }

  render(elem) {
    const { peopleAmount, hoursAmount, tables } = select.booking;
    const { datePicker, hourPicker } = select.widgets;
    elem.innerHTML = templates.bookingWidget();
    this.dom = {
      wrapper: elem,
      peopleAmount: elem.querySelector(peopleAmount),
      hoursAmount: elem.querySelector(hoursAmount),
      datePicker: elem.querySelector(datePicker.wrapper),
      hourPicker: elem.querySelector(hourPicker.wrapper),
      tables: elem.querySelectorAll(tables)
    };
  }

  initWidgets() {
    this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
    this.datePicker = new DatePicker(this.dom.datePicker);
    this.hourPicker = new HourPicker(this.dom.hourPicker);
    this.dom.wrapper.addEventListener('updated', () => this.updateDom());
  }

  getData() {
    const {
      dateEndParamKey,
      dateStartParamKey,
      repeatParam,
      notRepeatParam,
      url,
      booking,
      event
    } = settings.db;
    const { minDate, maxDate } = this.datePicker;

    const startEndDates = {};
    startEndDates[dateEndParamKey] = utils.dateToStr(maxDate);
    startEndDates[dateStartParamKey] = utils.dateToStr(minDate);

    const endDate = {};
    endDate[dateEndParamKey] = startEndDates[dateEndParamKey];

    const params = {
      booking: utils.queryParams(startEndDates),
      eventsCurrent: `${notRepeatParam}&${utils.queryParams(startEndDates)}`,
      eventsRepeat: `${repeatParam}&${utils.queryParams(endDate)}`
    };

    const urls = {
      booking: `${url}/${booking}?${params.booking}`,
      eventsCurrent: `${url}/${event}?${params.eventsCurrent}`,
      eventsRepeat: `${url}/${event}?${params.eventsRepeat}`
    };

    const self = this;

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat)
    ])
      .then(function([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]) {
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json()
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]) {
        self.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    this.booked = {};
    const { maxDays, minDate } = this.datePicker;
    eventsCurrent.forEach(event => this.makeBooked(event));
    bookings.forEach(event => this.makeBooked(event));
    eventsRepeat.forEach(event => {
      for (let i = 0; i < maxDays; i++) {
        event['date'] = utils.dateToStr(utils.addDays(minDate, i));
        this.makeBooked(event);
      }
    });
    this.updateDom();
  }

  makeBooked({ date, hour, duration, table }) {
    !this.booked[date] ? (this.booked[date] = {}) : null;
    let bookDate = this.booked[date];
    hour = /:30/.test(hour) ? hour.replace(':30', '.5') : hour.replace(':00', '');

    for (let i = 0; i <= duration * 2 - 1; i++) {
      !bookDate[hour] ? (bookDate[hour] = [table]) : bookDate[hour].push(table);
      hour = (Number(hour) + 0.5).toString();
    }
  }

  updateDom() {
    const {tableIdAttribute: id} = settings.booking;
    this.date = this.datePicker.value;
    this.hour = utils.hourToNumber(this.hourPicker.value);

    this.dom.tables.forEach(table => {
      const tableId = table.getAttribute(id);
      const bookDate = this.booked[this.date];
      const {tableBooked} = classNames.booking;

      if(bookDate && bookDate[this.hour] && bookDate[this.hour].includes(Number(tableId))){
        table.classList.add(tableBooked);
      } else {
        table.classList.remove(tableBooked);
      }
    });
  }
}
