$(document).ready(function () {
    $("#search-container").on('input', '#searchInfo', function () {
        $("#searchInfo").autocomplete({
            source: function (request, response) {
                var category = $("input[name='category']:checked").val();
                var query = $("#searchInfo").val();
                if (query.length >= 2) {
                    // Mostrar el indicador de carga
                    $("#loadingIndicator").show();
                    $.ajax({
                        url: 'http://mediamaster.ieti.site/api/search?category=' + category + '&query=' + query,
                        dataType: "json",
                        success: function (data) {
                            // Ocultar el indicador de carga
                            $("#loadingIndicator").hide();
                            var results = data.results;
                            response(results);
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            // Ocultar el indicador de carga en caso de error
                            $("#loadingIndicator").hide();
                            console.log("Error en la solicitud:", jqXHR);
                            console.log("Texto del estado:", textStatus);
                            console.log("Error lanzado:", errorThrown);
                        }
                    });
                }
            },
            minLength: 2,
            select: function (event, ui) {
                searchItem(ui.item);
            }
        }).data("ui-autocomplete")._renderItem = function (ul, item) {
            var listItem = $("<li class='list'>");
            var listItemContent = '<div><img src="' + (item.image ? item.image : '') + '" alt="' + item.label + '" style="width: 60px; height: 80px; margin-right: 10px;">' + '<br>' + item.label + '</div>';
            return listItem.append(listItemContent).appendTo(ul);
        };

        $("#searchInfo").autocomplete("widget").addClass("custom-autocomplete");

        $("#searchInfo").keypress(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                searchItem();
            }
        });
    });

    // Cambio de categoría al hacer clic en un botón de radio
    $("input[name='category']").change(function () {
        $("#searchInfo").val(''); // Limpiar el campo de búsqueda al cambiar de categoría
    });

    function searchItem(selectedItem) {
        var selectedInfo = selectedItem ? selectedItem : $("#searchInfo").val();
        $("#details").empty();
        var category = $("input[name='category']:checked").val();
        var infoURL = '';
        if (category === 'movie' || category === 'tv') {
            infoURL = "http://mediamaster.ieti.site/api/details?category=" + category + "&id=" + selectedInfo.id;
        } else if (category === 'books') {
            infoURL = "https://www.googleapis.com/books/v1/volumes?q=" + selectedInfo.id;
        } else if (category === 'games') {
            infoURL = "http://mediamaster.ieti.site/api/details?category=" + category + "&id=" + selectedInfo.id;
        }

        $.ajax({
            url: infoURL,
            dataType: "json",
            success: function (data) {
                var html = '';
                var largeImageUrl = data.imageUrl;

                if (category === 'movie' || category === 'tv') {
                    if (data.id) {
                        var genres = data.genres.map(function (genre) {
                            return genre.name;
                        }).join(', ');
                        var companies = data.production_companies.map(function (company) {
                            return company.name;
                        }).join(', ');
                        console.log(data);
                        var releaseDate = category === 'movie' ? data.release_date : data.first_air_date;
                        html = '<div class="details-container">' +
                            '<h2>' + (category === 'movie' ? data.title : data.name) + '</h2>' +
                            '<div class="info">' +
                            '<img src="' + largeImageUrl + '" alt="' + data.name + ' Poster">' +
                            '<div class="description">' + data.overview + '</div>' +
                            '</div>' +
                            '<div class="additional-info">' +
                            '<p><strong>Genres:</strong> ' + genres + '</p>' +
                            '<p><strong>Release Date:</strong> ' + releaseDate + '</p>' +
                            '<p><strong>Companies:</strong> ' + companies + '</p>';
                    } else {
                        html = "<p>No se encontraron detalles para esta búsqueda</p>";
                    }
                } else if (category === 'books') {
                    var volumeInfo = data.items[0].volumeInfo;
                    largeImageUrl = volumeInfo.imageLinks.thumbnail;
                    console.log(volumeInfo);
                    html = '<div class="details-container">' +
                        '<h2>' + volumeInfo.title + '</h2>' +
                        '<div class="info">' +
                        '<img src="' + largeImageUrl + '" alt="' + volumeInfo.title + ' Poster">' +
                        '<div class="description">' + volumeInfo.description + '</div>' +
                        '</div>' +
                        '<div class="additional-info">' +
                        '<p><strong>Authors:</strong> ' + (volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown') + '</p>' +
                        '<p><strong>Published Date:</strong> ' + volumeInfo.publishedDate + '</p>' +
                        '<p><strong>Publisher:</strong> ' + (volumeInfo.publisher ? volumeInfo.publisher : 'Unknown') + '</p>';
                } else if (category === 'games') {
                    console.log(data)
                    html = '<div class="details-container">' +
                        '<h2>' + data.name + '</h2>' +
                        '<div class="info">' +
                        '<img src="' + largeImageUrl + '" alt="' + data.name + ' Poster">' +
                        '<div class="description">' + data.description + '</div>' +
                        '</div>' +
                        '<div class="additional-info">' +
                        '<p><strong>Release Date:</strong> ' + data.release_date + '</p>' +
                        '<p><strong>Genres:</strong> ' + data.genres.map(genre => genre.name).join(', ') + '</p>' +
                        '<p><strong>Franchises:</strong> ' + data.franchises.map(franchises => franchises.name).join(', ') + '</p>';
                }
                html += '<select id="listas">' +
                    '<option value="favourites">Favourites</option>' +
                    '<option value="2">Pendientes</option>' +
                    '</select> <button id="saveLists">Save</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
                $("#details").html(html);
                $("#searchInfo").val('');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error en la solicitud:", jqXHR);
                console.log("Texto del estado:", textStatus);
                console.log("Error lanzado:", errorThrown);
            }
        });
    }
});