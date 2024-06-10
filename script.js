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
        fileItem.addEventListener('click', () => loadFile(file));
        fileList.appendChild(fileItem);
    });
}

(async function() {
    const files = await fetchFileList();
    displayFileList(files);

    // Check for the 'book' parameter in the URL and autoload the file if present
    const book = getUrlParameter('book');
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
            currentMeaning.setAttribute('data-strength', meanings[0][1]);
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
                    currentMeaning.setAttribute('data-strength', meaning[1]);
                    currentMeaning.style.borderColor = getBorderColor(meaning[1]);
                    toggleBorders(); // Update border visibility based on the toggle
                };
                meaningsDiv.appendChild(meaningSpan);
            });

            element.appendChild(currentMeaning);
            element.appendChild(meaningsDiv);

            element.oncontextmenu = function (event) {
                event.preventDefault();
                const url = `https://www.google.com/search?q=${encodeURIComponent(wp[0])}`;
                window.open(url, '_blank');
            };

            element.onmousedown = function (event) {
                if (event.ctrlKey) {
                    const url = `https://logeion.uchicago.edu/${encodeURIComponent(wp[0])}`;
                    window.open(url, '_blank');
                }
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

// Function to update the tooltip position
// Function to update the tooltip position
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        const tooltipHeight = tooltip.offsetHeight;
        const additionalOffset = 10; // Adjust this value as needed

        // Calculate new position
        let newTopPosition = event.clientY - tooltipHeight - additionalOffset;
        let newLeftPosition = event.clientX - 20;//(tooltip.offsetWidth / 2);
console.log(newTopPosition);
newTopPosition = newTopPosition < 0 ? 0 : newTopPosition;
        // Get the screen width
        const screenWidth = window.innerWidth;

        // Check if the tooltip spills over to the right
        // if (newLeftPosition + tooltip.offsetWidth > screenWidth) {
        //     tooltip.style.maxWidth = `${screenWidth - event.clientX - 20}px`; // Adjust width to fit within the screen
        // } else
        // tooltip.style.maxWidth = screenWidth;

        // Check if the tooltip spills over to the left
        if (newLeftPosition < 0) {
        //   tooltip.style.maxWidth = `${event.clientX - 20}px`; // Adjust width to fit within the screen
            newLeftPosition = 10; // Set a minimum left position
        }

        const visibleTopPosition = newTopPosition < window.scrollY ? window.scrollY : newTopPosition;
        // Apply new position
        tooltip.style.top = `${visibleTopPosition}px`;
        tooltip.style.left = `${newLeftPosition}px`;
    }
}

