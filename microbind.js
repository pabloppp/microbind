//ENCAPSULAMOS LA LIBRERIA PARA QUE SE EJECUTE DESPUES DE CARGAR EL HTML
(function(window, document, undefined) {'use strict';
	var $ = window.$ || (window.$ = {});
	
	console.log('%c', 'padding:50px 100px;line-height:120px;background:url(http://media.indiedb.com/images/groups/1/3/2392/awesome-cat.jpg) no-repeat;background-size:contain');
	console.log('%c YOU are using MICROBIND \n ~ Made for you by \'The Super Toys\' ~ ', 'padding:2px; line-height:1.5em; background: #292525; color: #7CBC4D');
	console.log('%cHAVE_FUN!!!', 'font-size: 2em; padding:2px; line-height:1.5em; background: #292525; color: #7CBC4D');

	//DEFINICIONES ---->
	$._functions = $._functions || [];
	$._functions_backup = $._functions_backup || [];
	$._watchList = $._watchList || [];
	$._bindingList = $._bindingList || {};
	//REDEFINIMOS LOS NODOS
	$._setNode = function(element){
		var newNode = element;
		newNode.text = function(text){
			if(text) newNode.innerHTML = text;
			return newNode.innerHTML;
		}
		newNode.destroy = function(){
			element.parentNode.removeChild(element);
		}
		return newNode;
	}

	//UTILIDADES ---->

	//BUSCAR ELEMENTO
	$.find = function(str, parentNode){
		parentNode = parentNode || document;
		if(str[0] == "#"){ //BUSCAMOS POR ID
			var id = str.slice(1);
			var element = $._setNode(parentNode.getElementById(id));
			return element;
		}
		else{
			var elements = parentNode.querySelectorAll(str);
			var nodes = [];
			[].forEach.call(elements, function(element){
				var newNode = $._setNode(element);
				nodes.push(newNode);	
			});
			return nodes;
		}
	}

	$.destroy = function(ele){
		for(var i in $._watchList){
			if ($._watchList[i].el == ele){
				$._watchList.splice(i, 1);
				i -= 1;	
			}
		}
		ele.parentNode.removeChild(ele);
	}

	$.watch = function(exp, fn, el){
		var watcher = {
			exp : exp,
			old : ($.eval(exp) && Array.isArray($.eval(exp))) ? $.eval(exp).slice(0) : $.eval(exp),
			fn : fn,
			el : el || document
		};
		$._watchList.push(watcher);
	}

	$.eval = function(str){
		var result;
		try{
			result = eval(str);
		}
		catch(error){
			if (typeof window[str] == "undefined") {
			    window[str] = undefined;
			}
			result = undefined;
		}
		return result;
	}

	$.HTMLSafe = function(text){
		if(!text) return text;
  		text = text.replace(/>/g, '&gt;');
  		text = text.replace(/</g, '&lt;');

  		return text;
	}

	//BINDINGS ---->

	$.binding = function(name, fn){
		$._bindingList[name] = fn;
	}

	$.apply = function(fn){
		fn();
		$.digest();
	}

	$.persistent = localStorage;
	$.p = $.persistent;

	$.digest = function(){
		var redigest = false;
		for(var index in $._watchList){
			var watcher = $._watchList[index];
			var evaluated = $.eval(watcher.exp);
			if( watcher.old != evaluated && watcher.old.toString() != evaluated.toString()){

				var newValue = $.eval(watcher.exp);
				watcher.fn(newValue, watcher.old);
				$._watchList[index].old = (newValue && Array.isArray(newValue)) ? newValue.slice(0) : newValue;
				
				redigest = true;	
			}
		}
		if(redigest) $.digest();
	}


	//EJECUCION ---->

	//AÑADIMOS LAS FUNCIONES QUE DEBERÁN EJECUTARSE AL CARGAR
	$.onLoad = function(name, fn){
		$._functions = $._functions || [];
		var fnctrl = {
			name : name,
			fn : fn
		}
		$._functions.push(fnctrl);
		return this;
	}

	$.stop = function(){
		$._stop = true;
		return this;
	}

	$.run = function(){
		$._stop = false;

		var body = document.getElementsByTagName('body')[0];
		$.body_clone = body.cloneNode(true);

		if($._functions){

			while($._functions.length > 0){ //EJECUTA LAS FUNCIONES
				var nodes = document.querySelectorAll("[bind-root="+$._functions[0].name+"]");

				if(nodes.length == 1){

					$.apply($._functions[0].fn);
					$._bindSetup(nodes[0]);

				}

				$._functions_backup.push($._functions[0]);
				$._functions.shift();
			}
			
		}
		return this;
	}

	$._bindSetup = function(node){
		for(var name in $._bindingList){ //INICIALIZA LOS BINDINGS
			var b_nodes = $.find("["+name+"]", node);
			for(var index in b_nodes){
				var attrVal = b_nodes[index].getAttribute(name);
				$._bindingList[name]().link(b_nodes[index], attrVal);
			}
		}	
	}



	$.reset = function(resetHTML){
		if($._stop) return;

		if(resetHTML){
			var body = document.getElementsByTagName('body')[0];
			body.parentNode.replaceChild($.body_clone, body);
		}
		else{
			var body = document.getElementsByTagName('body')[0];
			body.parentNode.replaceChild(body.cloneNode(true), body);
		}

		while($._functions_backup.length > 0){ //RESETEA LAS FUNCIONES
				$._functions = [];
				$._functions.push($._functions_backup[0]);
				$._functions_backup.shift();
		}
		$._watchList = [];

		$.run();
	}

	//EJECUTAREMOS LAS FUNCIONES TRAS CARGAR EL HTML
	document.addEventListener("DOMContentLoaded", function(event) { 
		if(!$._stop) $.run();
	});

})(window, document); 


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~



//AQUI DEFINIMOS TODOS LOS BINDINGS!!!
//para ver la lista de posibles eventos ir a http://www.w3schools.com/jsref/dom_obj_event.asp

$.binding("bind", function(){
	var link = function(element, attrs){

		var content = $.eval(attrs);
		if(element.tagName == "INPUT") element.value = content || "";
		element.text($.HTMLSafe(content));
		(function(){
			$.watch(attrs, function(newvalue, oldvalue){
				var content = newvalue;
				if(element.tagName == "INPUT" && element.value != (content || "") ) element.value = content || "";
				element.innerHTML = $.HTMLSafe(content);	
			}, element);
		}());
		if(element.tagName == "INPUT"){
			element.addEventListener("input", function(){
				$.apply(function(){
					$.eval(attrs+"='"+element.value+"'");
				})
			});
		}	

	}
	return {link: link};
});

$.binding("bind-unsafe", function(){
	var link = function(element, attrs){
		var content = $.eval(attrs);
		if(element.tagName == "INPUT") element.value = content || "";
		element.text(content);
		(function(){
			$.watch(attrs, function(newvalue, oldvalue){
				var content = newvalue;
				if(element.tagName == "INPUT" && element.value != (content || "") ) element.value = content || "";
				element.innerHTML = content;	
			}, element);
		}());
		if(element.tagName == "INPUT"){
			element.addEventListener("input", function(event){
				$.apply(function(){
					$.eval(attrs+"='"+element.value+"'");
				})
			});
		}
	}
	return {link: link};
});

$.binding("bind-click", function(){
	var link = function(element, attrs){
		element.addEventListener("click", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-focus", function(){
	var link = function(element, attrs){
		element.addEventListener("focus", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-blur", function(){
	var link = function(element, attrs){
		element.addEventListener("blur", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-hover", function(){
	var link = function(element, attrs){
		element.addEventListener("mouseover", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-hover-out", function(){
	var link = function(element, attrs){
		element.addEventListener("mouseout", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-scroll", function(){
	var link = function(element, attrs){
		element.addEventListener("scroll", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-drag", function(){
	var link = function(element, attrs){
		element.setAttribute("draggable", "true");
		element.addEventListener("drag", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-drag-start", function(){
	var link = function(element, attrs){
		element.addEventListener("dragstart", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-drag-over", function(){
	var link = function(element, attrs){
		element.addEventListener("dragover", function(event){
			event.preventDefault();
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-drag-end", function(){
	var link = function(element, attrs){
		element.addEventListener("dragend", function(event){
			$.apply(function(){
				$.eval(attrs);
			})
		});
	}
	return {link: link};
});

$.binding("bind-drop", function(){
	var link = function(element, attrs){
		element.addEventListener("drop", function(event){
			event.preventDefault();
			$.apply(function(){
				$.eval(attrs);
			})
		});
		element.addEventListener("dragover", function(event){
			event.preventDefault();
		});
	}
	return {link: link};
});

$.binding("bind-hide", function(){
	var link = function(element, attrs){
		var content = $.eval(attrs);
		if(content && content != "") element.classList.add("bind-hide");
		else element.classList.remove("bind-hide");

		(function(){
		$.watch(attrs, function(newvalue, oldvalue){

			if(newvalue && newvalue != "") element.classList.add("bind-hide");
			else element.classList.remove("bind-hide");

		}, element);
		}());
	}
	return {link: link};
});

$.binding("bind-show", function(){
	var link = function(element, attrs){
		var content = $.eval(attrs);
		if(content && content != "") element.classList.remove("bind-hide");
		else element.classList.add("bind-hide");

		(function(){
		$.watch(attrs, function(newvalue, oldvalue){

			if(newvalue && newvalue != "") element.classList.remove("bind-hide");
			else element.classList.add("bind-hide");

		}, element);
		}());
	}
	return {link: link};
});

$.binding("bind-foreach", function(){
	var link = function(element, attrs){
		var startComment = document.createComment("bind-foreach-start=\""+attrs+"\"");
		var endComment = document.createComment("bind-foreach-end=\""+attrs+"\"");
		//var text = document.createTextNode("Water");
		element.removeAttribute("bind-foreach");

		var template = element.cloneNode(true);

		var varName = attrs.split(" in ")[0].trim();
		var arrayName = attrs.split(" in ")[1].trim();

		body = document.getElementsByTagName('body')[0];

		body.insertBefore(startComment, element);
		body.insertBefore(endComment, element);

		element.parentNode.removeChild(element);
		
		var populate = function(){
			try{
				var evaluated = JSON.parse($.eval(arrayName));
			}catch(error){
				var evaluated = $.eval(arrayName);
			}
			for(var index in evaluated){
				(function(){
					$.apply(function(){
						var newNode = template.cloneNode(true);
						var newIdx = arrayName+"['"+index+"']";
						var scapedNewIdx = ("\\"+newIdx).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
						newNode.innerHTML = newNode.innerHTML.replace(new RegExp(varName, 'g'), newIdx);

						newNode.innerHTML = newNode.innerHTML.replace(new RegExp(scapedNewIdx, 'g'), varName);

						$._bindSetup(newNode);

						body.insertBefore(newNode, endComment);
					})
				}());
			}
		}
		populate();

		

		$.watch(arrayName, function(newvalue, oldvalue){
			if(newvalue.length != oldvalue.length){
				console.log("repopulate "+newvalue+" "+oldvalue);

				var node = startComment.nextSibling;
				var realNodes = [];
				while(node != endComment){
					realNodes.push(node);
					node = node.nextSibling;					
				}

				//clear old nodes
				for(var i in realNodes){
					$.destroy(realNodes[i]);
				}
				
				//adding new nodes

				for(var index in newvalue){

							var newNode = template.cloneNode(true);
							var newIdx = arrayName+"['"+index+"']";
							var scapedNewIdx = ("\\"+newIdx).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
							newNode.innerHTML = newNode.innerHTML.replace(new RegExp(varName, 'g'), newIdx);

							newNode.innerHTML = newNode.innerHTML.replace(new RegExp(scapedNewIdx, 'g'), varName);

							$._bindSetup(newNode);

							body.insertBefore(newNode, endComment);
		
				}

				//---	
				
				//populate();	
			}	
		}, element);

		

	}
	return {link: link};
});

$.binding("bind-class", function(){
	var link = function(element, attrs){
		if(attrs[0] == "{" && attrs[attrs.length-1] == "}"){
			var expr = attrs.substring(1, attrs.length-1);
			var conditionList = expr.split(",");
			for(var i in conditionList){
				(function () { //declare new scope
					var condition = conditionList[i].trim();
					var pair = condition.split(":");
					if(pair.length == 2){
						var key = pair[0];
						var val = pair[1];
						$.watch(val, function(newvalue, oldvalue){
							process(newvalue, oldvalue);
						}, element);
						var process = function(newval, oldval){
							var keyParsed = $.eval(key);
							if(!newval || newval == ""){
								if(element.classList.contains(keyParsed)) element.classList.remove(keyParsed);	
							}
							else{
								if(!element.classList.contains(keyParsed)) element.classList.add(keyParsed);
							};
						}
						process($.eval(val));
					}
				}());
			}
		}
		else console.log("wrong bind-class expression")
	}
	return {link: link};
});


document.getElementsByTagName('head')[0].innerHTML += '<style type="text/css">@charset "UTF-8";[bind-cloak],.bind-hide{display:none;}</style>';
