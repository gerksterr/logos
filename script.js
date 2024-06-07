async function fetchFileList() {
    try {
        const response = await fetch('translations/');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = [...doc.querySelectorAll('a')].filter(link => link.href.endsWith('.tra'));
        return links.map(link => 'translations/' + link.getAttribute('href'));
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        return [];
    }
}

async function loadFile(file) {
    try {
		//findProblematicLine(file);
		//return;
        const response = await fetch(`${file}?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        var text = await response.text();
		text = text.trim().endsWith(',') ? text.trim().slice(0, -1) : text.trim();
		const jsonText = `[${text}]`;
		console.log(jsonText);
       const wordPairs = JSON.parse(jsonText);
		Showtranslation(wordPairs);
		
		
        //document.getElementById('fileContent').textContent = text;
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
})();

function Showtranslation(wordPairs){

const textContainer = document.getElementById('text');
    textContainer.innerHTML = '';

function getBorderColor(strength) {
  const red = Math.round(255 * (1 - strength / 100));
  const green = Math.round(255 * (strength / 100));
  return `rgb(${red}, ${green}, 0)`;
}

function toggleBorders() {
  console.log('test2');
  const toggle = document.getElementById('toggle-border').checked;
  console.log(toggle);
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

  console.log('test');
wordPairs.forEach(wp => {
  var element;
  if (wp.length == 0) {
    element = document.createElement('p');
    element.innerHTML = '&nbsp;'; // Adding a non-breaking space to ensure the paragraph is rendered
    textContainer.appendChild(element);
  } else {
    element = document.createElement('span');
    element.className = 'word';
    element.setAttribute('data-greek', wp[0]);

    const meanings = wp.slice(1);

    const currentMeaning = document.createElement('span');
    currentMeaning.className = 'current-meaning border-color';
    currentMeaning.innerText = meanings[0][0];
    currentMeaning.setAttribute('data-greek', wp[0]);
    currentMeaning.setAttribute('data-strength', meanings[0][1]);
    currentMeaning.style.borderColor = getBorderColor(meanings[0][1]);

    const meaningsDiv = document.createElement('div');
    meaningsDiv.className = 'meanings';

    meanings.forEach(meaning => {
  console.log('test3');
      const meaningSpan = document.createElement('span');
      meaningSpan.innerText = meaning[0];
      meaningSpan.style.display = 'block';
      meaningSpan.style.cursor = 'pointer';
      meaningSpan.style.borderColor = getBorderColor(meaning[1]);
      meaningSpan.className = 'border-color';
      meaningSpan.onclick = function() {
        currentMeaning.innerText = meaning[0];
        currentMeaning.setAttribute('data-strength', meaning[1]);
        currentMeaning.style.borderColor = getBorderColor(meaning[1]);
        toggleBorders(); // Update border visibility based on the toggle
      };
      meaningsDiv.appendChild(meaningSpan);
    });

    element.appendChild(currentMeaning);
    element.appendChild(meaningsDiv);

    element.oncontextmenu = function(event) {
      event.preventDefault();
        const url = `https://www.google.com/search?q=${encodeURIComponent(wp[0])}`;
      window.open(url, '_blank');
    };

    element.onmousedown = function(event) {
      if (event.ctrlKey) {
        const url = `https://logeion.uchicago.edu/${encodeURIComponent(wp[0])}`;
        window.open(url, '_blank');
      }
    };

    textContainer.appendChild(element);
  }
});


document.getElementById('toggle-border').addEventListener('change', toggleBorders);

// Initial call to apply the border visibility based on the default toggle state
toggleBorders();
}


async function findProblematicLine(file) {
    const response = await fetch(`${file}?t=${new Date().getTime()}`);
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    let text = await response.text();

    // Trim and remove any trailing comma
    text = text.trim();
    if (text.endsWith(',')) {
        text = text.slice(0, -1);
    }

    // Split the text into lines
    const lines = text.split('\n');

    // Function to attempt parsing the JSON text with a given number of lines
    function attemptParse(linesToKeep) {
		
		
        var jsonText = linesToKeep.join('\n');
		jsonText = jsonText.trim().endsWith(',') ? jsonText.trim().slice(0, -1) : jsonText.trim();
		jsonText = `[${jsonText}]`;
		
        try {
            JSON.parse(jsonText);
            return true;  // Parsing succeeded
        } catch (error) {
			console.log(error);
			console.log(jsonText);
            return false;  // Parsing failed
        }
    }

    // Iterate over the lines to find the first problematic one
    for (let i = 0; i < lines.length; i++) {
        const linesToKeep = lines.slice(0, i + 1);
        if (!attemptParse(linesToKeep)) {
            console.log('Parsing failed at line', i + 1);
            console.log('Problematic line:', lines[i]);
            break;
        }
    }
}

findProblematicLine('your_file_path_here');