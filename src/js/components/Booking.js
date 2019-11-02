import { templates, select, settings, classNames } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';
import { DatePicker } from './DatePicker.js';
import { HourPicker } from './HourPicker.js';
import { utils } from '../utils.js';

export class Booking {
  constructor(elem) {
    this.db = settings.db;

    this.initPage(elem);
  }

  async initPage(elem) {
    this.render(elem);

    /* Check if booking has uuid */
    const { hash } = window.location;
    const re = /#\/\w+\/\w+/;
    re.test(hash) ? await this.updateBookingData(hash.substring(10)) : null;
    // console.log('data should be collected');

    this.initWidgets();
    this.getData();
  }

  render(elem) {
    const {
      peopleAmount,
      hoursAmount,
      tables,
      button,
      address,
      phone,
      starter
    } = select.booking;
    const { datePicker, hourPicker } = select.widgets;
    elem.innerHTML = templates.bookingWidget();

    /*  NA ROZMOWĘ
    Czy this.dom można zapisać jakoś ładniej? bez pisania milion razy tego samego?  */
    this.dom = {
      wrapper: elem,
      peopleAmount: elem.querySelector(peopleAmount),
      hoursAmount: elem.querySelector(hoursAmount),
      datePicker: elem.querySelector(datePicker.wrapper),
      hourPicker: elem.querySelector(hourPicker.wrapper),
      tables: elem.querySelectorAll(tables),
      button: elem.querySelector(button),
      address: elem.querySelector(address),
      phone: elem.querySelector(phone),
      starter: elem.querySelectorAll(starter)
    };
  }

  initWidgets() {
    this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
    this.datePicker = new DatePicker(this.dom.datePicker);
    this.hourPicker = new HourPicker(this.dom.hourPicker, 14);
    // this.hourPicker.value = 14;
    /* NA ROZMOWĘ
    wrzuciłem tutaj .bind i działa fajnie -> pytanie czy to dobrze?
    inaczej this leci na window,
    ta opcja co rozmawialiśmy => metoda = () => {funkcja} wywala mi ESLinta
    */
    this.dom.wrapper.addEventListener('updated', this.updateDom.bind(this));
    this.dom.tables.forEach(table =>
      table.addEventListener('click', this.selectTable.bind(this))
    );
    this.dom.button.addEventListener('click', e => {
      e.preventDefault();
      this.sendBooking();
    });
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
    const { tableIdAttribute: id } = settings.booking;
    this.date = this.datePicker.value;
    this.hour = utils.hourToNumber(this.hourPicker.value);

    this.dom.tables.forEach(table => {
      const tableId = table.getAttribute(id);
      const bookDate = this.booked[this.date];
      const { tableBooked } = classNames.booking;

      if (
        bookDate &&
        bookDate[this.hour] &&
        bookDate[this.hour].includes(Number(tableId))
      ) {
        table.classList.add(tableBooked);
      } else {
        table.classList.remove(tableBooked);
      }
    });

    this.selectTable();
  }

  async sendBooking() {
    const { url, booking } = settings.db;

    if (this.tableId) {
      const payload = {
        uuid: utils.uuid(),
        date: this.date,
        hour: this.hourPicker.value,
        table: this.tableId,
        peopleAmount: this.peopleAmount.value,
        duration: this.hoursAmount.value,
        phone: this.dom.phone.value,
        address: this.dom.address.value,
        starters: []
      };
      this.dom.starter.forEach(starter => {
        starter.checked ? payload.starters.push(starter.value) : null;
      });

      await fetch(`${url}/${booking}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // const parsedData = await response.json();
      // console.log(parsedData);
      this.getData();
    }
  }

  selectTable(e) {
    const { tableBooked: booked, reserved } = classNames.booking;
    const { tableIdAttribute } = settings.booking;
    this.dom.tables.forEach(table => table.classList.remove(reserved));

    if (e) {
      const table = e.target.classList;

      if (!table.contains(booked)) {
        table.add(reserved);
        this.tableId = parseInt(e.target.getAttribute(tableIdAttribute));
      } else {
        this.tableId = 0;
      }
    }
  }

  async updateBookingData(uuid) {
    const response = await fetch(`${this.db.url}/${this.db.booking}`);
    const parsedData = await response.json();
    this.bookingToUpdate = parsedData.filter(booking => booking.uuid === uuid)[0];
    const {date, duration, hour, peopleAmount, table, starters, phone, address} = this.bookingToUpdate;
    
    const { datePicker, hourPicker } = select.widgets;
    // this.dom.wrapper.querySelector(hourPicker.input).value = hour;
    // this.dom.wrapper.querySelector(hourPicker.input).value = 14;
    this.dom.wrapper.querySelector(datePicker.input).value = date;
    
    
    // const hourUpdate = new HourPicker(this.dom.hourPicker, 15);
    // hourUpdate.value = 19;
    // const test = this.dom.wrapper.querySelector(hourPicker.output);
    // const test = this.dom.wrapper.querySelector('.hour-picker');
    // this.hourPicker.value = 19;
    this.dom.hoursAmount.querySelector('input').setAttribute('value', duration);
    this.dom.peopleAmount.querySelector('input').value = peopleAmount;
    this.dom.starter.forEach(starter =>{
      starters.includes(starter.value) ? starter.checked = true : null;
    });
    this.dom.phone.value = phone;
    this.dom.address.value = address;
  }
}
