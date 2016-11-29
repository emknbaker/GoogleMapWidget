mod.service('legendsService', [

    function() {
        
        var self = this;
        var availableShapes = ['square'
                                ,'diamond'
                                ,'circle'
                                ,'triangle-up'
                                ,'triangle-down'
                                ,'triangle-left'
                                ,'triangle-right'
                                ,'pentagon'
                                ,'hexagon'
                                ,'star'
                                ,'three-point-star'
                                ,'four-point-star'
                                ,'gear'
                                ,'x-shape'
                                ,'plus'
                                ,'arrow-up'
                                ,'arrow-down'
                                ,'arrow-left'
                                ,'arrow-right'
                                ,'bar-horizontal'
                                ,'bar-vertical'
                             ];

        var open,  colorCategory, shapeCategory, shapesMetadata, map, shapeArray, e, markers;

        var serviceFunctions =  { 

            init: function(inColorCategory, inShapeCategory, inShapesMetadata, inMap, inE, inMarkers) { 
                colorCategory = inColorCategory;
                shapeCategory = inShapeCategory;
                shapesMetadata = inShapesMetadata;
                map = inMap;
                e = inE;
                markers = inMarkers;
                //Map Side Bar Begin

                $(map.getDiv()).append($('<div id="mapSidebar">'
                    + '<div id="mapSidebarHide"><i class="fa fa-caret-left"></i></div>'
                    + '<div id="mapSidebarContent"></div>'
                    + '</div>'));
                $('#mapSidebar').css('left', 0);
                $('#mapSidebar').css('top', 0);
                $('#mapSidebar').hide();

                $(map.getDiv()).append($('<div id="mapSidebarShow"><i class="fa fa-caret-right"></i></div>'));

                $('#mapSidebarContent').height($(map.getDiv()).height());
                $('#mapSidebarContent').append($('<div id="mapSidebarHeader">'
                    + '<span class="active" id="colorLegend">Color Legend</span>'
                    + '<span class="tabDivider"></span>'
                    + '<span class="inactive" id="shapeLegend">Shape by</span>'
                    + '</div>'));
                $('#mapSidebarContent').append($('<div id="mapColorLegendContent"></div>'));
                $('#mapSidebarContent').append($('<div id="mapShapeLegendContent"></div>'));

                $('#mapColorLegendContent').append($('<table id="mapSidebarColorTable"><tbody><tr><th colspan="2">' 
                    + (colorCategory ? colorCategory : "No Results") + '</th></tr></tbody></table>'));
                $('#mapShapeLegendContent').append($('<table id="mapSidebarShapeTable"><tbody><tr><th colspan="2">'
                    + (shapeCategory ? shapeCategory : "No Results") + '</th></tr></tbody></table>'));

                $('#mapColorLegendContent').height($(map.getDiv()).height() - 70);
                $('#mapShapeLegendContent').height($(map.getDiv()).height() - 70);

                $('#mapShapeLegendContent').hide();

                $('#mapSidebarHide').click(function () {
                    $('#mapSidebar').hide("slide", { direction: "left" }, 200);
                    $("#mapSidebarShow").show();
                });

                $('#mapSidebarShow').click(function () {
                    $("#mapSidebarShow").hide();
                    $('#mapSidebar').show("slide", { direction: "left" }, 200);
                });

                $('#colorLegend').click(function () {
                    $('#colorLegend').addClass('active').removeClass('inactive');
                    $('#shapeLegend').addClass('inactive').removeClass('active');
                    $('#mapShapeLegendContent').hide();
                    $('#mapColorLegendContent').show();
                });

                $('#shapeLegend').click(function () {
                    $('#shapeLegend').addClass('active').removeClass('inactive');
                    $('#colorLegend').addClass('inactive').removeClass('active');
                    $('#mapColorLegendContent').hide();
                    $('#mapShapeLegendContent').show();
                });
        
                //Map Side Bar End
            },

            addRowsToColorLegend: function(arr) {
                _.each(arr, function(row){
                    $('#mapSidebarColorTable tbody').append($("<tr id='colorRow"+row.selector+"' class='colorLegendRow'>"
                        +"<td class='colorLegendDescription'><span>"+row.value+"</span></td>"
                        +"<td class='colorLegendImg'><i class='fa fa-square' style='color:" + row.color + "; font-size: 20px;'></i></td>"
                        +"</tr>"));
                });
            },
            
            addRowsToClusterLegend: function() {
                var arr = [
                    { img: "m1", value: "1 - 9",},
                    { img: "m2", value: "10 - 99",},
                    { img: "m3", value: "100 - 999",},
                    { img: "m4", value: "1000 - 9999",},
                    { img: "m5", value: "10000+",},
                ];
                _.each(arr, function(row){
                    $('#mapSidebarColorTable tbody').append($("<tr id='clusterRow"+row.img+"' class='colorLegendRow'>"
                        +"<td class='clusterLegendImg'><img src='/plugins/googleMapsWidget/resources/markerclusterer/images/"+row.img +".png';></img></td>"
                        +"<td class='clusterLegendDescription'><span>"+row.value+"</span></td>"        
                        +"</tr>"));
                });
            },
            
            openShapeSelection: function(row, selector, y) {
                $('#shapeSelectionWindow').remove();
                if(open != row) {
                    var htmlString = '<div id="shapeSelectionWindow"><div class="k-content" id="shapeSelectionContent"></div></div>'
                    $(map.getDiv()).append($(htmlString));
                    $('#shapeSelectionWindow').css("top", "" + (y-125) +  "px");
                    open = row;
                    _.each(availableShapes, function(shape) {
                        var shapeString = '<div class="shapeSelectionRow" id="'+shape+'">'
                            + '<img src="/plugins/googleMapsWidget/resources/shapes/'+shape+'.png"'
                            + 'title="'+shape+'"/>'
                        '</div>'
                        $('#shapeSelectionWindow #shapeSelectionContent').append(shapeString);

                        $('#shapeSelectionWindow div #'+shape).click(function(){
                            serviceFunctions.changeShapeOfCategory(row, shape, selector);
                            $('#shapeSelectionWindow').remove();
                        });
                    });
                }
                else {
                    open = null;
                }
            },
						
            addRowsToShapeBy:  function(arr) {
                var shapeColumn = _.find(shapesMetadata, function(category){
                    return category.column == shapeCategory;
                });

                _.each(arr, function(row){
                    var shape = "circle";
                    if(shapeColumn && shapeColumn.items) {
                        var item = _.find(shapeColumn.items, function(item) {
                            return item.value == row;
                        });
                        if(item) {
                            shape = item.shape;
                        }
                    }
                    var rowId;
                    if (typeof row === 'string' || row instanceof String) {
                        rowId = row.replace(/\W/g, '');
                    }
                    else { 
                        rowId = row;
                    }
                    $('#mapSidebarShapeTable tbody').append($("<tr id='shapeRow"+rowId+"' class='shapeLegendRow'>"
                        +"<td class='shapeLegendDescription'><span>"+row+"</span></td>"
                        +"<td class='shapeLegendImg'><img src='/plugins/googleMapsWidget/resources/shapes/"+shape+".png'/></td>"
                        +"</tr>"));
                    $('#shapeRow'+rowId+' td.shapeLegendImg img').click(function(e) {
                        serviceFunctions.openShapeSelection(row, rowId, e.pageY);
                    });
                });

                shapeArray = arr;
            },

            changeShapeOfCategory: function(data, shape, selector) {
                _.each(markers, function(marker){
                    if(marker.shape === data) {
                        marker.marker.icon =
                        {
                            url: "/ColoredShapeHandler.ashx?shape=" + shape + "&color=FF" + marker.color.replace('#', ''),
                            anchor: new google.maps.Point(10, 10)
                        };
                        marker.marker.setMap(null);
                        marker.marker.setMap(map);
                    }
                });
                $('#shapeRow'+selector+' td.shapeLegendImg img').attr('src', '/plugins/googleMapsWidget/resources/shapes/'+shape+'.png');
                var shapeMetadataColumn = _.find(shapesMetadata, function(category){
                    return category.column == shapeCategory;
                });
                if(shapeMetadataColumn) {
                    var item = _.find(shapeMetadataColumn.items, function(item){
                        return item.value == data;
                    });
                    if(item && item.shape) {
                        item.shape = shape;
                    }
                    else {
                        shapeMetadataColumn.items.push({
                            value : data,
                            shape: shape
                        })
                    }
                }
                else {
                    shapesMetadata.push({
                        column : shapeCategory,
                        items : [{
                            value : data,
                            shape: shape
                        }]
                    })
                }
                e.widget.queryMetadata.savedShapes = shapesMetadata;
                e.widget.changesMade();
            },

            getRandomShape: function() { 
                return availableShapes[_.random((availableShapes.length - 1))];
            },

            clear: function(inColorCategory, inShapeCategory) {
                colorCategory = inColorCategory;
                shapeCategory = inShapeCategory;
               $("#mapSidebarColorTable tr").remove(); 
               $("#mapSidebarShapeTable tr").remove(); 

               $("#mapSidebarColorTable tbody").append($('<tr><th colspan="2">' + (colorCategory ? colorCategory : "No Results")
                    +'</th></tr>'));
               $("#mapSidebarShapeTable tbody").append($('<tr><th colspan="2">' + (shapeCategory ? shapeCategory : "No Results")
                    +'</th></tr>'));
            }
        
        }

        return serviceFunctions;

    }
]);