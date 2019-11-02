export class BaseWidget {
  constructor(wrapper, initValue) {
    this.dom = {
      wrapper: wrapper
    };
    this._value = initValue;
  }

  get value(){
    return this._value;
  }

  set value(val){
    const newVal = this.parseValue(val);

    if(newVal != this._value && this.isValid(newVal)){
      this._value = newVal;
      this.announce();
    }

    this.renderValue();
  }

  parseValue(val){
    return parseInt(val);
  }

  isValid(val){
    return !isNaN(val);
  }

  renderValue(){
    console.log(this);
  }

  announce(){
    this.dom.wrapper.dispatchEvent(new CustomEvent('updated', {
      bubbles: true
    }));
  }
}
