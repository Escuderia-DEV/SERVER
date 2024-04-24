var user_mail = localStorage.getItem('user_mail');
var user_id = localStorage.getItem('user_id');
var user_name = localStorage.getItem('user_name');

$(document).ready(function () {
    
    if (window.location.pathname === '/search' || window.location.pathname === '/dashboard') {
        if (!user_mail) {
            window.location.href = 'http://localhost:3000/';
        } 
    } else if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/forgot' || window.location.pathname === '/resetPassword' || window.location.pathname === '/') {
        if (user_mail) {
            window.location.href = 'http://localhost:3000/search';
        }
    }

    // Toastify
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

    // Busqueda de información para Index y Search
    $("#search-container").on('input', '#searchInfo', function () {
        $("#searchInfo").autocomplete({
            source: function (request, response) {
                var category = $("input[name='category']:checked").val();
                var query = $("#searchInfo").val();
                console.log(query);
                if (query.length >= 2) {
                    // Mostrar el indicador de carga
                    $("#loadingIndicator").show();
                    $.ajax({
                        url: 'http://localhost:3000/api/search?category=' + category + '&query=' + query,
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
            infoURL = "http://localhost:3000/api/details?category=" + category + "&id=" + selectedInfo.id;
        } else if (category === 'books') {
            infoURL = "http://localhost:3000/api/details?category=" + category + "&id=" + selectedInfo.id;
        } else if (category === 'games') {
            infoURL = "http://localhost:3000/api/details?category=" + category + "&id=" + selectedInfo.id;
        }

        $.ajax({
            url: infoURL,
            dataType: "json",
            success: function (data) {
                console.log(data);
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
                    var volumeInfo = data.volumeInfo;
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
                        '<p><strong>Franchises:</strong> ' + data.franchises.map(franchise => franchise.name).join(', ') + '</p>' +
                        '</div>' +
                        '</div>';
                }
                if (!user_mail) {
                    html +=
                        '</div>' +
                        '</div>' +
                        '</div>';
                    $("#details").html(html);
                    $("#searchInfo").val('');
                } if (window.location.pathname === '/search') {
                    html +=
                        '<button id="saveItem" value="' + selectedInfo.id + '">Add to list</button></div></div>';
                    '</div>' +
                        '</div>';
                    $("#details").append(html);
                    showListsAndAddToLists(selectedInfo.id, category);
                    $("#searchInfo").val('');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error en la solicitud:", jqXHR);
                console.log("Texto del estado:", textStatus);
                console.log("Error lanzado:", errorThrown);
            }
        });
    }
    /**************************************************************************************************************/

    // Login
    function loginUser(email, password) {
        $.ajax({
            url: 'http://localhost:3000/login',
            method: 'POST',
            data: {
                email: email,
                password: password
            },
            success: function (data) {
                console.log(data);
                if (data.success) {
                    localStorage.setItem('user_id', data.userData[0].user_id);
                    localStorage.setItem('user_mail', email);
                    localStorage.setItem('user_name', data.userData[0].user_name);
                    window.location.href = 'http://localhost:3000/search';
                } else {
                    showNotification('User or Password incorrect', 'red');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error en la solicitud:", jqXHR);
                console.log("Texto del estado:", textStatus);
                console.log("Error lanzado:", errorThrown);
            }
        });
    }

    $("#loginForm").on('submit', function (event) {
        event.preventDefault();
        var email = $("#email").val();
        var password = $("#password").val();
        loginUser(email, password);
    });

    /**************************************************************************************************************/

    // Register
    $("#registerForm").on('submit', function (event) {
        event.preventDefault();
        var email = $("#email").val();
        var user = $("#user").val();
        var password = $("#password").val();
        var password2 = $("#password2").val();
        if (password !== password2) {
            showNotification('Passwords do not match', 'red');
        } else {
            registerUser(email, user, password);
        }
    });

    function registerUser(email, user, password) {
        console.log(email, user, password);
        $.ajax({
            url: 'http://localhost:3000/register',
            method: 'POST',
            data: {
                email: email,
                user: user,
                password: password
            },
            success: function (data) {
                console.log(data);
                if (!data.success) {
                    showNotification('User already exists', 'red');
                } else {
                    showNotification('User created', 'green');
                    window.location.href = 'http://localhost:3000/login';
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error en la solicitud:", jqXHR);
                console.log("Texto del estado:", textStatus);
                console.log("Error lanzado:", errorThrown);
            }
        });
    }

    /**************************************************************************************************************/

    // Forgot Password
    $("#forgotForm").on('submit', function (event) {
        event.preventDefault();
        var email = $("#email").val();
        forgotPassword(email);
    });

    function forgotPassword(email) {
        console.log(email);
        $.ajax({
            url: 'http://localhost:3000/forgot',
            method: 'POST',
            data: {
                email: email
            },
            success: function (data) {
                console.log(data);
                if (!data.success) {
                    showNotification('User does not exist', 'red');
                } else {
                    showNotification('Recovery email sent successfully', 'green');
                }
                $("#email").val('');
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Error en la solicitud:", jqXHR);
                console.log("Texto del estado:", textStatus);
                console.log("Error lanzado:", errorThrown);
            }
        });
    }

    /**************************************************************************************************************/

    // Reset Password
    $("#recoverPasswd").submit(function (e) {
        e.preventDefault();
        var password = $("#password").val();
        var repeatPassword = $("#repeatPassword").val();
        if (password != repeatPassword) {
            showNotification("Passwords do not match", 'orange');
            return;
        } else {
            var token = new URLSearchParams(window.location.search).get("token");
            $.ajax({
                type: "POST",
                url: "http://localhost:3000/resetPassword",
                data: { token: token, password: password },
                success: function (data) {
                    if (data.success) {
                        $("#recoverPasswd").hide();
                        showNotification(data.message, 'green');
                    } else {
                        showNotification(data.error, 'red');
                    }
                },
                error: function (xhr, status, error) {
                    showNotification("An error occurred while processing your request", 'red');
                }
            });
        }
    });

    /**************************************************************************************************************/

    // Search
    if (window.location.pathname === '/search') {
        $("#welcome").append('Welcome, ' + user_name + '!')
        $("#signOut").click(function () {
            localStorage.removeItem('user_mail');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_name');
            window.location.href = 'http://localhost:3000/';
        });

        function getUsersList(user_mail, user_id) {
            $.ajax({
                url: 'http://localhost:3000/viewUserLists',
                type: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    user_mail: user_mail,
                    user_id: user_id
                },
            })
                .done(function (data) {
                    listas = data;
                    $("#myLists").empty();
                    html = '<form action="" method="" id="addElementOnList">';
                    data.forEach(function (list) {
                        html += "<div id=allLists>"
                        $("#myLists").append('<p><a href="" value="' + list.list_id + '">' + list.list_name + '</p>');
                        html += '<label><input type="checkbox" name="list" value="' + list.list_id + '"> ' + list.list_name + '</label><br>';
                    });

                    html += '</div></form>';
                    $("#addToLists").append(html);
                });
        }

        function showListsAndAddToLists(item_id, category) {
            // Desvincular controladores de eventos previos
            $("#saveItem").off('click');
            $("#saveToList").off('click');
            $("#closeListsView").off('click');

            $("#saveItem").on('click', function (event) {
                console.log(item_id);
                $("#addToLists").css('display', 'grid');


                $(".layout").css('filter', 'blur(5px)');
                $(".layout").addClass('disable-buttons');
            });

            $("#saveToList").on('click', function (event) {
                event.preventDefault();
                $("#success").html('Added on Lists:');
                $("#duplicated").html('Duplicated on Lists:');
                $("input[name='list']:checked").each(function () {
                    console.log($(this).val());
                    if (category === 'books') {
                        category_id = 'book_id';
                    } else if (category === 'movie') {
                        category_id = 'movie_id';
                    } else if (category === 'tv') {
                        category_id = 'serie_id';
                    } else if (category === 'games') {
                        category_id = 'game_id';
                    }
                    saveItem($(this).val(), category_id, item_id);
                });
            });

            $("#closeListsView").on('click', function (event) {
                event.preventDefault();
                $(".layout").css('filter', 'blur(0)');
                $("#addToLists").css('display', 'none');
                $(".layout").removeClass('disable-buttons');
            });
        }

        function saveItem(list_id, category, item_id) {
            console.log(list_id, category, item_id);
            $.ajax({
                url: 'http://localhost:3000/addMediaToList',
                type: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    list_id: list_id,
                    category: category,
                    item_id: item_id
                }),
                success: function (data) {
                    console.log(data);
                    if (data.success) {
                        $("#success").append(' ' + data.lists).css('color', 'green');
                    } else {
                        $("#duplicated").append(' ' + data.lists).css('color', 'orange');
                    }
                    $("input[name='list']").prop('checked', false);
                    list_id = null;
                    item_id = null;
                    category = null;
                },
            })
        }
        getUsersList(user_mail, user_id);
    }
});