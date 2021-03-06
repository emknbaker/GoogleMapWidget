mod.service('kmlService', [

    function() {
        
        var self = this;

        var _kmlControlsShowing = false,
            _presentKMLLayers = [],
            _layersClicked = [],
            widgetMap,
            google,
            map,
            protocol,
            numberOfFilesPresent = 0;

        /*
            Steps to add a KML file(s) to the list.
            1. Place the file(s) in NavPortWebMVC/Content/assets/explorer/kml/
            2. Add the file to ExplorerController.cs in the MVC application under the GetKmlLayerDownloadtoken method. Record the switch-case numbers.
            3. Reflect these changes in KMLHandler.ashx in the MVC application.
            4. Reflect these changes in this project under handlers/KMLHansler.ashx
            4. Update the ReturnKmlLayer function with new file(s).
            5. Create an object in the kmlLayers[] array with the beginning switch-case number, friendly name of the file to display, 
                and number of files that should be loaded on a single click to generate the entire area (See below). 
            6. Update the layerIsSelected() function with the beginning switch case number and end switch-case number if there are multiple files. 
            7. Reflect these changes (steps 5 & 6) in the MVC application's explorer.kml.JSON
            8. Pull request, merge, clean, rebuild, and deploy as usual for MVC application and widget. 
        */

        var kmlLayers = [
            { id: 5,  title: 'Proppant Mine Locations', files: 1 },
            { id: 4,  title: 'Transload Terminal Locations', files: 1 },
            { id: 0,  title: 'US Rail Network', files: 4 },
            { id: 15, title: 'Barnett Basin', files: 1 },
            { id: 16, title: 'DJ Basin', files: 2 },
            { id: 18, title: 'Eaglebine Basin', files: 1 },
            { id: 6,  title: 'Eagleford Basin', files: 9 },
            { id: 19, title: 'Fayetteville Basin', files: 1 },
            { id: 20, title: 'Haynesville Basin', files: 1 },
            { id: 21, title: 'Marcellus Basin', files: 1 },
            { id: 22, title: 'Permian Basin', files: 4 },
            { id: 26, title: 'PRB Basin', files: 1 },
            { id: 27, title: 'San Juan Basin', files: 1 },
            { id: 28, title: 'TMS Basin', files: 1 },
            { id: 29, title: 'Utica Basin', files: 2 },
            { id: 31, title: 'Woodford Basin', files: 1 }
        ];

        var serviceFunctions =  { 

            init: function(inWidgetMap, inGoogle, inProtocol) { 
                map = widgetMap = inWidgetMap,
                google = inGoogle;
                protocol = inProtocol;

                var controlDiv = document.createElement('div');
                serviceFunctions.CenterControl(controlDiv, widgetMap);
                controlDiv.index = 1;
                widgetMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);

                var errorDiv = $('<div id="mapErrorDiv">' +
                    '<div id="mapErrorDivContent">' + 
                        '<h3>Warning</h3> Too many KML layers loaded onto map, please remove a layer and try again.' + 
                    '</div>' + 
                '</div>')

                $(map.getDiv()).append(errorDiv);
                $('#mapErrorDiv').hide();
                $('#mapErrorDiv').on('click', function(){
                    $( "#mapErrorDiv" ).fadeOut(250, "linear", function() {});
                });
            },

            CenterControl: function(controlDiv, map) { 
                // Set CSS for the control border.
                var control = document.createElement('div');
                control.id = "KMLLayerButtonGroup";
                controlDiv.appendChild(control);
                control.setAttribute("data-html2canvas-ignore", "true")

                // Set list
                var ul = document.createElement('ul');
                ul.className = "dropdown-memu";

                var controlHide = document.createElement('li');
                controlHide.id = "KMLLayerButtonGroupHide";
                controlHide.innerHTML = "KML Layer Selection"

                var iRight = document.createElement('i');
                iRight.className = "fa fa-chevron-down";
                controlHide.appendChild(iRight);

                ul.appendChild(controlHide);

                controlHide.addEventListener('click', function () {
                    if (_kmlControlsShowing) {
                        iRight.className = "fa fa-chevron-down";
                        var x = document.getElementsByClassName("kmlItem");
                        var i;
                        for (i = 0; i < x.length; i++) {
                            x[i].style.display = "none";
                        }
                        _kmlControlsShowing = false;
                    }
                    else {
                        iRight.className = "fa fa-chevron-up";
                        var x = document.getElementsByClassName("kmlItem");
                        var i;
                        for (i = 0; i < x.length; i++) {
                            x[i].style.display = "";
                        }
                        _kmlControlsShowing = true;
                    }
                });

                _.each(kmlLayers, function (layer) {
                    var li = document.createElement('li');
                    li.className = "kmlItem"
                    li.style.display = "none";
                    var a = document.createElement('a');
                    //a.id = "KMLLayerCheckBox" + layer.id;

                    // Setup the click event listeners: simply set the map to Chicago.
                    $(a).on('click', function () {
                        var present = serviceFunctions.hasBeenClicked(layer.id);
                        if(!present && numberOfFilesPresent + layer.files > 14) { 
                            $( "#mapErrorDiv" ).fadeIn(250, "linear", function() {
                                setTimeout(function(){ 
                                     $( "#mapErrorDiv" ).fadeOut(250, "linear", function() {});
                                }, 5000);
                            });
                        }
                        else { 
                            serviceFunctions.setKMLLayer(layer.id, layer.files);
                            if(present) { 
                                numberOfFilesPresent -= layer.files;
                            }
                            else { 
                                numberOfFilesPresent += layer.files;
                            }
                        }
                    });

                    a.innerHTML = '<i class="fa fa-check" id="KMLLayerCheckBox'+layer.id+'" aria-hidden="true"></i>' + layer.title
                    li.appendChild(a);
                    ul.appendChild(li);

                });

                control.appendChild(ul);
            },

            setKMLLayer: function(kmlId, nof) {
                var numReturned = {
                    num : 0
                }
                //All US Rail Networks
                if (nof > 1) {
                    //First time click
                    var maxFile = kmlId + nof;
                    if (!serviceFunctions.hasBeenClicked(kmlId)) {
                        serviceFunctions.disableLayer(kmlId);
                        for (var i = kmlId; i < maxFile; i++) {
                            serviceFunctions.loadLayer(i, true, numReturned, nof);
                        }
                        _layersClicked.push(kmlId)
                    }
                    //Toggle attributes if not first click
                    else {
                       $('#KMLLayerCheckBox' + kmlId).css("visibility", "hidden");
                        _.each(_presentKMLLayers, function (loc) {
                            if (loc.kmlId >= kmlId && loc.kmlId < maxFile) {
                                loc.kmlLayer.setMap(null);
                                loc.kmlLayer = null;
                                delete loc.kmlLayer;
                            }
                        });
                        _presentKMLLayers = _.reject(_presentKMLLayers, function (loc) {
                            return loc.kmlId >= kmlId && loc.kmlId < maxFile;
                        });
                        var idx = _layersClicked.indexOf(kmlId);
                        if(idx > -1) { 
                            _layersClicked.splice(idx, 1);
                        }
                    }
                }
                else {
                     //First time click
                    if (!serviceFunctions.hasBeenClicked(kmlId)) {
                        serviceFunctions.disableLayer(kmlId);
                        serviceFunctions.loadLayer(kmlId, true, numReturned, nof);
                        _layersClicked.push(kmlId);
                    }
                    //Click off
                    else {
                        $('#KMLLayerCheckBox' + kmlId).css("visibility", "hidden");
                        var item = _.find(_presentKMLLayers, function (loc) {
                            return loc.kmlId === kmlId;
                        });
                        if (item) {
                            item.kmlLayer.setMap(null);
                            item.kmlLayer = null;
                            delete item.kmlLayer;
                        }
                        _presentKMLLayers = _.reject(_presentKMLLayers, function (loc) {
                            return loc.kmlId === kmlId
                        });
                        var idx = _layersClicked.indexOf(kmlId);
                        if(idx > -1) { 
                            _layersClicked.splice(idx, 1);
                        }
                    }
                }
            },

            //Check if the layer is selected in the dropdown
            layerIsSelected: function(kmlId) {
                //If a US rail, check if 0 is selected
                if (kmlId < 4) {
                    kmlId = 0;
                }
                else if(kmlId >= 6 && kmlId <= 14) {
                    kmlId = 6;
                }
                else if(kmlId >= 16 && kmlId <= 17) {
                    kmlId = 16;
                }
                else if(kmlId >= 22 && kmlId <= 25) {
                    kmlId = 22;
                }
                else if(kmlId >= 29 && kmlId <= 30) {
                    kmlId = 29;
                }
                
                 return _layersClicked.indexOf(kmlId) > -1;
            },

            getTopLayer: function(kmlId) { 
                //If a US rail, check if 0 is selected
                if (kmlId < 4) {
                    kmlId = 0;
                }
                else if(kmlId >= 6 && kmlId <= 14) {
                    kmlId = 6;
                }
                else if(kmlId >= 16 && kmlId <= 17) {
                    kmlId = 16;
                }
                else if(kmlId >= 22 && kmlId <= 25) {
                    kmlId = 22;
                }
                else if(kmlId >= 29 && kmlId <= 30) {
                    kmlId = 29;
                }
                
                 return kmlId;
            },

            //Check if the layer has been selected at least one time
            hasBeenClicked: function(kmlId) {
                return _layersClicked.indexOf(kmlId) > -1;
            },

            disableLayer: function(kmlId) {
                var a = $('#KMLLayerCheckBox' + kmlId).parent();
                $(a).off('click');
                $(a).html('<i id="KMLLayerCheckBox'+kmlId+'" aria-hidden="true"></i> Loading...');
                $(a).css("font-style", "italic");
                $(a).hover(function() {
                    if($(this).css('cursor') == "pointer") { 
                        $(this).css("cursor", "default");
                    }
                });
            },

            enableLayer: function(kmlId, good) { 
                kmlId = serviceFunctions.getTopLayer(kmlId);
                var a = $('#KMLLayerCheckBox' + kmlId).parent();
                $(a).css("font-style", "");
                $(a).css("cursor", "pointer");
                $(a).hover(function() {
                        $(this).css("cursor", "pointer");
                });
                var layer = _.find(kmlLayers, function(kml) { 
                    return kml.id === kmlId;
                });
                $(a).html('<i class="fa' + (good ? ' fa-check"' : ' fa-times"') +  'id="KMLLayerCheckBox'+kmlId+'" aria-hidden="true"></i> ' + layer.title);
                $('#KMLLayerCheckBox' + kmlId).css("visibility", "visible");
                $(a).click(function () {
                    var present = serviceFunctions.hasBeenClicked(layer.id);
                    if(!present && numberOfFilesPresent + layer.files > 14) { 
                        $( "#mapErrorDiv" ).fadeIn(250, "linear", function() {
                            setTimeout(function(){ 
                                    $( "#mapErrorDiv" ).fadeOut(250, "linear", function() {});
                            }, 5000);
                        });
                    }
                    else { 
                        serviceFunctions.setKMLLayer(layer.id, layer.files);
                        if(present) { 
                            numberOfFilesPresent -= layer.files;
                        }
                        else { 
                            numberOfFilesPresent += layer.files;
                        }
                    }
                });
            },

            clearKmlLayers: function() {
                $('[id^="KMLLayerCheckBox"]').each(function (item) {
                    $(this).css("visibility", "hidden");
                });
                _.each(_presentKMLLayers, function (layer) {
                    layer.kmlLayer.setMap(null);
                    layer.checked = false;
                });
            },

            loadLayer: function(id, allowReload, numReturned, nof) {
                return $.ajax({
                    url: "/KMLHandler.ashx?id=" + id + "&username=" + prism.user.userName,
                    method: "POST",
                    dataType: "JSON"
                }).done(function (data) {
                    if (data.success) {
                        // Use for the KML in Sisense
                        var longUrl;
                        if(location.host.indexOf(":") > -1) { 
                            longUrl = protocol + "://" + location.host.substring(0, location.host.length - 5) + "/Explorer/ReturnKmlLayer?token=" +  encodeURIComponent(data.token);
                        }
                        else { 
                            longUrl = protocol + "://" +  location.host + "/Explorer/ReturnKmlLayer?token=" +  encodeURIComponent(data.token);
                        } 
                        longUrl = longUrl.replace("dashboards", "analytics");
                        var request = gapi.client.urlshortener.url.insert({
                           'resource': {
                               'longUrl': longUrl
                           }
                        });
                        request.execute(function(response)
                        {
                            if (response && response.id) {
                                var kmlUrl = response.id;
                                var kmlLayer = new google.maps.KmlLayer({
                                    url: kmlUrl,
                                    map: map,
                                    preserveViewport: true
                                });

                                var item = {
                                    kmlLayer: kmlLayer,
                                    kmlId: id
                                };

                                _presentKMLLayers.push(item);
                                serviceFunctions.checkForLayer(kmlLayer, id, kmlUrl, allowReload, numReturned, nof);
                            }
                            else {
                                console.warn('Google API failed.');
                            }
                        });
                    }
                });
            },

            checkForLayer: function(kmlLayer, id, kmlUrl, allowReload, numReturned, nof) { 
                //Error handling
                //If fails, just try again, up to 10 times
                var _layerRetries = 0;
                var interval = setInterval(function () {
                    if (kmlLayer.getStatus() && kmlLayer.getStatus() === "OK") {    
                        clearInterval(interval);
                        numReturned.num += 1;
                        if(numReturned.num == nof) { 
                            serviceFunctions.enableLayer(id, true);
                        } 
                    }
                    else {
                        _layerRetries += 1;
                        if(_layerRetries < 6) { 
                            console.warn('KML layer not added [' + id + ']. Retrying.');
                            kmlLayer = new google.maps.KmlLayer({
                                        url: kmlUrl,
                                        map: map,
                                        preserveViewport: true
                                    });

                            var item =_.find(_presentKMLLayers, function(item) { 
                                    return item.kmlId === id;
                                });
                            if(item) { 
                                item.kmlLayer = kmlLayer;
                            }
                        }
                        //If max number of retries are reached
                        else { 
                           
                            _presentKMLLayers =_.reject(_presentKMLLayers, function(item) { 
                                return item.kmlId === id;
                            });
                            clearInterval(interval); 
                            if(allowReload) { 
                                serviceFunctions.loadLayer(id, false, numReturned, nof);
                                console.warn('KML layer not added [' + id + ']. Retrying with new token.');
                            }
                            else { 
                                console.warn('KML layer not added [' + id + ']. Retries failed as well.');
                                numReturned.num += 1;
                                if(numReturned.num == nof) { 
                                    serviceFunctions.enableLayer(id, false);
                                }
                            }                              
                        }
                    }
                }, 5000);
            }
        }

        return serviceFunctions;

    }
]);