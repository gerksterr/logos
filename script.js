let ctrlPressed = false;
let shiftPressed = false;
let isGreek = false;

function measureTextWidth(text, font = '16px Arial') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width + 10;
}

function toggleGreekWords(showGreek) {
    if(showGreek)
        if(isGreek) return;
        else isGreek = true;
    else
        if(!isGreek) return;
        else isGreek = false;

    const words = document.querySelectorAll('.word .current-meaning');
    words.forEach(word => {
        const greekWord = word.parentElement.getAttribute('data-greek').split(' - ')[0];
        const englishWord = word.getAttribute('data-english');
        if (showGreek) {
            word.setAttribute('data-original', word.innerText);
            word.innerText = greekWord;
            const greekWidth = measureTextWidth(greekWord);
            const englishWidth = measureTextWidth(englishWord);
            word.parentElement.style.width = `${Math.max(greekWidth, englishWidth)}px`;
        } else  {
            const originalText = word.getAttribute('data-english');
            if (originalText) {
                word.innerText = originalText;
                word.parentElement.style.width = 'auto';
            }
        }
    });
}

function showMeaningsInPlace(showMeanings) {
    const words = document.querySelectorAll('.word .current-meaning');
    words.forEach(word => {
        const meanings = word.parentElement.querySelectorAll('.meanings span');
        if (showMeanings) {
            const translation = meanings[0].innerText;
            word.setAttribute('data-original', word.innerText);
            word.innerText = translation;
        } else {
            const greekWord = word.getAttribute('data-original');
            if (greekWord) {
                word.innerText = greekWord;
            }
        }
    });
}

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && !ctrlPressed) {
        ctrlPressed = true;
        toggleGreekWords(true);
    }
    if (event.shiftKey && ctrlPressed && !shiftPressed) {
        shiftPressed = true;
        showMeaningsInPlace(true);
    }
});

document.addEventListener('keyup', (event) => {
    if (!event.ctrlKey && ctrlPressed) {
        ctrlPressed = false;
        shiftPressed = false;
        toggleGreekWords(false);
    }
    if (!event.shiftKey && shiftPressed) {
        shiftPressed = false;
        if (ctrlPressed) {
            showMeaningsInPlace(false);
        }
    }
});

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        // Wait for the next animation frame to ensure proper rendering
        requestAnimationFrame(() => {
            const tooltipHeight = tooltip.offsetHeight;
            const tooltipWidth = tooltip.offsetWidth;
            const additionalOffset = 10; // Adjust this value as needed

            // Get the screen dimensions and scroll position
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const scrollY = window.scrollY;

            // Calculate initial position
            let newTopPosition = event.clientY + scrollY - tooltipHeight - additionalOffset;
            let newLeftPosition = event.clientX - (tooltipWidth / 2);

            // Reset maxWidth before recalculating
            tooltip.style.maxWidth = 'none';

            // Adjust if the tooltip spills over to the right
            if (newLeftPosition + tooltipWidth > screenWidth) {
                newLeftPosition = screenWidth - tooltipWidth - 10; // Set new left position to fit within the screen
            }

            // Adjust if the tooltip spills over to the left
            if (newLeftPosition < 0) {
                newLeftPosition = 10; // Set a minimum left position
            }

            // Adjust if the tooltip would go off the top of the screen
            if (newTopPosition < scrollY) {
                newTopPosition = event.clientY + scrollY + additionalOffset;
            }

            // Ensure the tooltip doesn't go off the bottom of the screen
            if (newTopPosition + tooltipHeight > scrollY + screenHeight) {
                newTopPosition = scrollY + screenHeight - tooltipHeight - additionalOffset;
            }

            // Apply new position
            tooltip.style.top = `${newTopPosition}px`;
            tooltip.style.left = `${newLeftPosition}px`;
        });
    }
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

async function fetchFileList() {
    try {
        const response = await fetch('translations.json');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const files = await response.json();
        return files.map(file => 'translations/' + file);
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        return [];
    }
}

async function loadFile(file) {
    try {
        const response = await fetch(`${file}?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        var text = await response.text();
        text = text.trim().endsWith(',') ? text.trim().slice(0, -1) : text.trim();
        const jsonText = `[${text}]`;
        const wordPairs = JSON.parse(jsonText);

        Showtranslation(wordPairs);
        //set cookie for the last opened book
        setCookie('lastBook', file.replace('translations/', ''), 365);
        
        document.title = `logos - ${file.replace('translations/', '')}`;
        window.history.pushState("logos", file.replace('translations/', ''), "?book=" + file.replace('translations/', ''));
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function displayFileList(files) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = file.replace('translations/', '');
        fileItem.addEventListener('click', () => {
            loadFile(file);
        });
        fileList.appendChild(fileItem);
    });
}

(async function() {
    const files = await fetchFileList();
    displayFileList(files);

    // Check for the 'book' parameter in the URL and autoload the file if present
    let book = getUrlParameter('book');
    if(!book) {
        book = getCookie('lastBook');
        window.history.pushState("logos", book.replace('translations/', ''), "?book=" + book.replace('translations/', ''));
    }
    if (book) {
        const fileToLoad = files.find(file => file.endsWith(book));
        if (fileToLoad) {
            loadFile(fileToLoad);
        } else {
            console.error('File not found: ' + book);
        }
    }
})();

function Showtranslation(wordPairs) {
    const textContainer = document.getElementById('text');
    textContainer.innerHTML = '';

    function getBorderColor(strength) {
        const red = Math.round(255 * (1 - strength / 100));
        const green = Math.round(255 * (strength / 100));
        return `rgb(${red}, ${green}, 0)`;
    }

    function toggleBorders() {
        const toggle = document.getElementById('toggle-border').checked;
        const words = document.querySelectorAll('.word');
        words.forEach(word => {
            const currentMeaning = word.querySelector('.current-meaning');
            const strength = parseInt(currentMeaning.getAttribute('data-strength'));
            if (strength === 100) {
            //if(currentMeaning.getAttribute("num-meanings") == 1) {
                if (toggle) {
                    currentMeaning.style.borderColor = getBorderColor(strength);
                } else {
                    currentMeaning.style.borderColor = 'transparent';
                }
            }
        });
    }

    wordPairs.forEach(wp => {
        var element;
        if (wp.length == 0) {
            element = document.createElement('p');
            element.innerHTML = '&nbsp;'; // Adding a non-breaking space to ensure the paragraph is rendered
            textContainer.appendChild(element);
        } else {
            element = document.createElement('span');
            element.className = 'word';
            var tooltip = wp[0];
            // Check the last element of wp. If it is a string, then add it at the end of the tooltip
            if (typeof wp[wp.length - 1] === 'string') {
                tooltip = `${tooltip} - ${wp[wp.length - 1]}`;
            }

            element.setAttribute('data-greek', tooltip);

            const meanings = wp.slice(1);

            const currentMeaning = document.createElement('span');
            currentMeaning.className = 'current-meaning border-color';
            currentMeaning.innerText = meanings[0][0];
            currentMeaning.setAttribute('data-greek', tooltip);
            currentMeaning.setAttribute('data-english', meanings[0][0]); // Save the English word
            currentMeaning.setAttribute('data-strength', meanings[0][1]);
            //currentMeaning.setAttribute('num-meanings', wp.length - 1);
            currentMeaning.style.borderColor = getBorderColor(meanings[0][1]);

            const meaningsDiv = document.createElement('div');
            meaningsDiv.className = 'meanings';

            meanings.forEach(meaning => {
                if (typeof meaning === 'string') return;

                const meaningSpan = document.createElement('span');
                meaningSpan.innerText = meaning[0];
                meaningSpan.style.display = 'block';
                meaningSpan.style.cursor = 'pointer';
                meaningSpan.style.borderColor = getBorderColor(meaning[1]);
                meaningSpan.className = 'border-color';
                meaningSpan.onclick = function () {
                    currentMeaning.innerText = meaning[0];
                    currentMeaning.setAttribute('data-english', meaning[0]);
                    currentMeaning.setAttribute('data-strength', meaning[1]);
                    currentMeaning.style.borderColor = getBorderColor(meaning[1]);
                    toggleBorders(); // Update border visibility based on the toggle
                };
                meaningsDiv.appendChild(meaningSpan);
            });

            element.appendChild(currentMeaning);
            element.appendChild(meaningsDiv);

            element.oncontextmenu = function (event) {         
                if(!event.altKey) return;
                event.preventDefault();
                const url = `https://www.google.com/search?q=${encodeURIComponent(wp[0])}`;
                window.open(url, '_blank');
            };

            textContainer.appendChild(element);

            // Add event listeners for the tooltip
            element.addEventListener('mouseenter', function(event) {
                const tooltip = document.getElementById('tooltip');
                tooltip.textContent = element.getAttribute('data-greek');
                tooltip.style.display = 'block';
                updateTooltipPosition(event);
            });

            element.addEventListener('mousemove', updateTooltipPosition);

            element.addEventListener('mouseleave', function() {
                const tooltip = document.getElementById('tooltip');
                tooltip.style.display = 'none';
            });
        }
    });

    document.getElementById('toggle-border').addEventListener('change', toggleBorders);

    // Initial call to apply the border visibility based on the default toggle state
    toggleBorders();
}


function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}