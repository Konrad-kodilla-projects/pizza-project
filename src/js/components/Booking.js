import { templates, select, settings, classNames } from '../settings.js';
import { AmountWidget } from './AmountWidget.js';
import { DatePicker } from './DatePicker.js';
import { HourPicker } from './HourPicker.js';
import { utils } from '../utils.js';

export class Booking {
  constructor(elem) {
    this.db = settings.db;
    this.toUpdate = {};

    this.initPage(elem);
    console.log(location);
  }

  async initPage(elem) {
    this.render(elem);

    /* Check if booking has uuid */
    const { hash } = window.location;
    const re = /#\/\w+\/\w+/;
    re.test(hash) ? await this.updateBookingData(hash.substring(10)) : null;

    this.initWidgets();
    await this.getData();
    this.removeBooked(this.toUpdate);
  }

  render(elem) {
    const {
      peopleAmount,
      hoursAmount,
      tables,
      button,
      address,
      phone,
      starter,
      buttonDelete,
      modal,
      modalClose,
      modalLink
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
      starter: elem.querySelectorAll(starter),
      buttonDelete: elem.querySelector(buttonDelete),
      modal: elem.querySelector(modal),
      modalClose: elem.querySelector(modalClose),
      modalLink: elem.querySelector(modalLink)
    };
  }

  initWidgets() {
    const { date, duration, peopleAmount, hour } = this.toUpdate;

    this.hoursAmount = new AmountWidget(this.dom.hoursAmount, duration);
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount, peopleAmount);
    this.datePicker = new DatePicker(this.dom.datePicker, date);
    this.hourPicker = new HourPicker(this.dom.hourPicker, hour);

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
    this.dom.buttonDelete.addEventListener('click', e => {
      e.preventDefault();
      this.deleteBooking();
    });
    this.dom.modalClose.addEventListener('click', () =>
      this.dom.modal.classList.remove(classNames.booking.active)
    );
  }

  async getData() {
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

    const responses = {
      booking: await fetch(urls.booking),
      eventsCurrent: await fetch(urls.eventsCurrent),
      eventsRepeat: await fetch(urls.eventsRepeat)
    };

    const parsedData = {
      bookings: await responses.booking.json(),
      eventsCurrent: await responses.eventsCurrent.json(),
      eventsRepeat: await responses.eventsRepeat.json()
    };

    this.parseData(parsedData);
  }

  parseData({ bookings, eventsCurrent, eventsRepeat }) {
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
    hour = utils.hourToNumber(hour);

    for (let i = 0; i <= duration * 2 - 1; i++) {
      !bookDate[hour] ? (bookDate[hour] = [table]) : bookDate[hour].push(table);
      hour += 0.5;
    }
  }

  removeBooked({ date, hour, duration, table }) {
    const bookDate = this.booked[date];

    for (let i = 0; i <= duration * 2 - 1; i++) {
      bookDate[hour] ? bookDate[hour].splice(bookDate[hour].indexOf(table), 1) : null;
      hour += 0.5;
    }

    this.updateDom();
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

    /* Check if item to update exists */
    const updateItem = this.toUpdate.uuid;

    if (this.tableId) {
      const itemId = updateItem ? '/' + this.toUpdate.id : '';

      const payload = {
        uuid: updateItem || utils.uuid(),
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

      await fetch(`${url}/${booking}${itemId}`, {
        method: updateItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      this.getData();

      const { modal, modalLink } = this.dom;
      const href =
        location.hash.length > 12 ? location.href : location.href + '/' + payload.uuid;
      
      modalLink.setAttribute('href', href);
      modalLink.innerHTML = href;
      modal.classList.add(classNames.booking.active);
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
    const { datePicker, hourPicker } = select.widgets;

    /* Get booking to update*/
    const response = await fetch(`${this.db.url}/${this.db.booking}`);
    const parsedData = await response.json();
    this.toUpdate = parsedData.filter(booking => booking.uuid === uuid)[0];

    /* Destruct item */
    const { date, starters, phone, address } = this.toUpdate;
    let hour = utils.hourToNumber(this.toUpdate.hour);
    this.toUpdate.hour = hour;

    /* Add booking data to html */
    this.dom.wrapper.querySelector(hourPicker.input).value = hour;
    this.dom.wrapper.querySelector(datePicker.input).value = date;

    this.dom.starter.forEach(starter => {
      starters.includes(starter.value) ? (starter.checked = true) : null;
    });
    this.dom.phone.value = phone;
    this.dom.address.value = address;
    this.dom.button.innerHTML = 'Update Booking';

    console.log('data updated');
  }

  async deleteBooking() {
    console.log(this.toUpdate);
    await fetch(`${this.db.url}/${this.db.booking}/${this.toUpdate.id}`, {
      method: 'DELETE'
    });

    this.updateDom();
  }
}
