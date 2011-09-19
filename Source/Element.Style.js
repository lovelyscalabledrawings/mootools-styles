/*
---

name: Element.Style

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires: 
  - Core/Element
  - Sheet/Sheet.Styles
  - Sheet/Sheet.Value
  
provides:
  - Element.Style

replaces: Core/Element.Style

...
*/

(function(){

var html = document.html;

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

var hasOpacity = (html.style.opacity != null);
var reAlpha = /alpha\(opacity=([\d.]+)\)/i;

var setOpacity = function(element, opacity){
	if (!element.currentStyle || !element.currentStyle.hasLayout) element.style.zoom = 1;
	if (hasOpacity){
		element.style.opacity = opacity;
	} else {
		opacity = (opacity * 100).limit(0, 100).round();
		opacity = (opacity == 100) ? '' : 'alpha(opacity=' + opacity + ')';
		var filter = element.style.filter || element.getComputedStyle('filter') || '';
		element.style.filter = reAlpha.test(filter) ? filter.replace(reAlpha, opacity) : filter + opacity;
	}
};

Element.Properties.opacity = {

	set: function(opacity){
		var visibility = this.style.visibility;
		if (opacity == 0 && visibility != 'hidden') this.style.visibility = 'hidden';
		else if (opacity != 0 && visibility != 'visible') this.style.visibility = 'visible';

		setOpacity(this, opacity);
	},

	get: (hasOpacity) ? function(){
		var opacity = this.style.opacity || this.getComputedStyle('opacity');
		return (opacity == '') ? 1 : opacity;
	} : function(){
		var opacity, filter = (this.style.filter || this.getComputedStyle('filter'));
		if (filter) opacity = filter.match(reAlpha);
		return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
	}

};

var floatName = (html.style.cssFloat == null) ? 'styleFloat' : 'cssFloat';

Element.implement({

	getComputedStyle: function(property){
		if (this.currentStyle) return this.currentStyle[property.camelCase()];
		var defaultView = Element.getDocument(this).defaultView,
			computed = defaultView ? defaultView.getComputedStyle(this, null) : null;
		return (computed) ? computed.getPropertyValue((property == floatName) ? 'float' : property.hyphenate()) : null;
	},

	setOpacity: function(value){
		setOpacity(this, value);
		return this;
	},

	getOpacity: function(){
		return this.get('opacity');
	},

	setStyle: function(property, value){
  	var handler = Sheet.Styles[property];
		switch (property){
			case 'opacity': return this.set('opacity', parseFloat(value));
			case 'float': property = floatName;
		}
		if (handler) {  
	    if (value.toString !== Object.prototype.toString && value.toString !== Array.prototype.toString) 
	      value = String(value);
	    if (value.toString === String.prototype.toString) value = Sheet.Value.translate(value);
	    value = handler[value.push ? 'apply' : 'call'](null, value);
	    property = handler.property;
		}
	  if (value === false) {
	    
	  } else {
		  if (handler.type == 'simple')
		    this.style[property] = value;
		  else 
		    for (var property in value) this.style[property] = value[property];
	  }
		return this;
	},

	getStyle: function(property){
		switch (property){
			case 'opacity': return this.get('opacity');
			case 'float': property = floatName;
		}
  	var handler = Sheet.Styles[property];
  	if (handler) {
  	  property = handler.property
  	  var result = this.style[property];
  		if (!result || property == 'zIndex'){
    	  if (handler.properties) {
      	  var properties = handler.properties;
      	  for (var result = [], i = 0, prop; prop = properties[i]; i++)
      	    result[i] = this.getStyle(prop);
      	} else result = this.getComputedStyle(property);
    	}
  		if (typeof result == 'string') result = Sheet.Value.translate(result);
  		var context = handler.type == 'simple' ? null : [];
  		result = handler[result.push ? 'apply' : 'call'](context, result);
  		if (result.join) {
  		  for (var values = result, result = [], ary, value, i = 0, j = values.length; i < j; i++) {
  		    value = values[i]
  		    if (value.join) {
  		      ary = true;
  		      value = value.join(' ');
  		    }
  		    result.push(value);
  		  }
  		  result = result.join(ary ? ', ' : ' ');
  		}
  	}
		if (typeof result == 'undefined' || result === false) result = ''
		else if (typeof result != 'string') result = String(result);
		if (Browser.opera || (Browser.ie && isNaN(parseFloat(result)))){
			if ((/^(height|width)$/).test(property)){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if (Browser.opera && String(result).indexOf('px') != -1) return result;
			if ((/^border(.+)Width|margin|padding/).test(property)) return '0px';
		}
		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

})();
