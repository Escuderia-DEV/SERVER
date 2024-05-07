var user_mail = localStorage.getItem('user_mail');
var user_id = localStorage.getItem('user_id');
var user_name = localStorage.getItem('user_name');
const url = "https://mediamaster.ieti.site";

$(document).ready(function () {

    if (window.location.pathname === '/search' || window.location.pathname === '/dashboard') {
        if (!user_mail) {
            window.location.href = url;
        }
    } else if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/forgot' || window.location.pathname === '/resetPassword' || window.location.pathname === '/') {
        if (user_mail) {
            window.location.href = url + '/dashboard';
        }
    }

    function showNotification(text, color) {
        Toastify({
            text: text,
            duration: 3000,
            newWindow: true,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: color,
            },
            onClick: function () { } // Callback after click
        }).showToast();
    }

    function searchItem(selectedItem, category) {
        var selectedInfo = selectedItem ? selectedItem : $("#searchInfo").val();
        $("#details").empty();
        var category = $("input[name='category']:checked").val() || category;
        var infoURL = '';
        infoURL = url + "/api/details?category=" + category + "&id=" + (selectedInfo.id ? selectedInfo.id : selectedInfo);

        $.ajax({
            url: infoURL,
            dataType: "json",
            success: function (data) {
                console.log(data)
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
                        //console.log(data);
                        var releaseDate = category === 'movie' ? data.release_date : data.first_air_date;
                        html = '<div class="details-container" id="' + (selectedInfo.id ? selectedInfo.id : selectedInfo) + '">' +
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
                    var volumeInfo = data.volumeInfo;
                    largeImageUrl = volumeInfo.imageLinks.thumbnail;
                    //console.log(volumeInfo);
                    html = '<div class="details-container" id="' + (selectedInfo.id ? selectedInfo.id : selectedInfo) + '">' +
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
                    //console.log(data)
                    html = '<div class="details-container" id="' + (selectedInfo.id ? selectedInfo.id : selectedInfo) + '">' +
                        '<h2>' + data.name + '</h2>' +
                        '<div class="info">' +
                        '<img src="' + largeImageUrl + '" alt="' + data.name + ' Poster">' +
                        '<div class="description">' + data.description + '</div>' +
                        '</div>' +
                        '<div class="additional-info">' +
                        '<p><strong>Release Date:</strong> ' + data.release_date + '</p>' +
                        '<p><strong>Genres:</strong> ' + data.genres.map(genre => genre.name).join(', ') + '</p>' +
                        '<p><strong>Franchises:</strong> ' + data.franchises.map(franchise => franchise.name).join(', ') + '</p>';
                }
                $("#detailedList").append(html);

                // delete button logic
                let id = selectedInfo.id ? selectedInfo.id : selectedInfo
                $("#" + id).append(`<button class='delete-button' data='${id}'><img class='delete-logo' src='img/delete.png'></button>`)
                $("#" + id).find(".delete-button").click(function () {
                    console.log("clic al boton = " + $(this).attr("data"));
                })
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error en la solicitud:", jqXHR);
                console.log("Texto del estado:", textStatus);
                console.log("Error lanzado:", errorThrown);
            }
        });
    }

    $("#signOut").click(function () {
        localStorage.removeItem('user_mail');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        window.location.href = url;
    });

    var list_id = localStorage.getItem('list_id');
    $(".delete-list").attr('id', list_id);

    $.ajax({
        url: url + '/viewDetailedList',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ list_id: list_id }),
    })
        .done(function (data) {
            console.log(data);
            lists = data.lists;
            $("#listName").text("List: " + data.list_name);
            for (const category in lists) {
                if (lists.hasOwnProperty(category) && lists[category].length > 0) {
                    const items = lists[category];
                    for (const item in items) {
                        console.log(category, items[item]);
                        searchItem(items[item], category);
                    }
                }
            }
        });

    $(".delete-list").click(function () {
        var list_id = $(this).attr('id');
        $.ajax({
            url: url + '/deleteList',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ list_id: list_id }),
        })
            .done(function (data) {
                localStorage.removeItem('list_id');
                location.href = url + '/dashboard';
                showNotification('List deleted successfully', 'green');
            });
    });
});