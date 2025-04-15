function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none'; // Hide each section
    });

    // Hide sidebar
    sidebar.classList.remove('open');
    // openSidebarBtn.style.display = 'block';

    // Show the selected section
    document.getElementById(sectionId).style.display = 'block';
}

// Function to load and display absent teachers data
async function loadAbsentTeachers() {
    const today = new Date(); // Get today's date
    const promises = []; // Array to store promises for fetching data

    // Loop through the next 7 days
    for (let i = 0; i < 7; i++) {
        const futureDate = new Date(today); // Create a new date object
        futureDate.setDate(today.getDate() + i); // Increment the date by i days

        const year = futureDate.getFullYear(); // Get the year
        const month = String(futureDate.getMonth() + 1).padStart(2, '0'); // Get the month (0-based)
        const day = String(futureDate.getDate()).padStart(2, '0'); // Get the day

        promises.push(getData(year, month, day)); // Add the fetch promise to the array
    }

    const results = await Promise.all(promises); // Wait for all promises to resolve

    // Sort results by date
    results.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Display the formatted data in the "Absent Teachers" tab
    const absentTeachersContent = document.getElementById('absent-teachers-content');
    absentTeachersContent.innerHTML = ''; // Clear previous content

    results.forEach(({ date, data }) => {
        const dayContainer = document.createElement('div'); // Create a container for the day
        dayContainer.classList.add('day-container'); // Add styling class

        const dateHeader = document.createElement('h4'); // Create a header for the date
        dateHeader.textContent = `Data: ${date}`;
        dayContainer.appendChild(dateHeader); // Add the date header to the container

        if (data && Object.keys(data).length > 0 ) {
            // If there is data for the day
            const table = document.createElement('table'); // Create a table element
            table.classList.add('absent-teachers-table'); // Add a class for styling

            const thead = document.createElement('thead'); // Create the table header
            thead.innerHTML = `
                <tr>
                    <th>Nebus</th>
                    <th>Pamoka</th>
                    <th>Klasė</th>
                    <th>Pavaduos</th>
                </tr>
            `;
            table.appendChild(thead); // Add the header to the table

            const tbody = document.createElement('tbody'); // Create the table body

            Object.keys(data).forEach(teacher => {
                const lessons = data[teacher]; // Get the lessons for the teacher

                lessons.forEach(({ lesson, class: className, notes }, index) => {
                    const row = document.createElement('tr'); // Create a row

                    if (index === 0) {
                        // Add the teacher's name only in the first row for this teacher
                        const teacherCell = document.createElement('td');
                        teacherCell.rowSpan = lessons.length; // Span across all rows for this teacher
                        teacherCell.textContent = teacher;
                        row.appendChild(teacherCell);
                    }

                    const lessonCell = document.createElement('td');
                    lessonCell.textContent = lesson;
                    row.appendChild(lessonCell);

                    const classCell = document.createElement('td');
                    classCell.textContent = className;
                    row.appendChild(classCell);

                    const substituteCell = document.createElement('td');
                    substituteCell.textContent = notes || 'N/A'; // Use notes as substitute teacher info
                    row.appendChild(substituteCell);

                    tbody.appendChild(row); // Add the row to the table body
                });
            });

            table.appendChild(tbody); // Add the body to the table
            dayContainer.appendChild(table); // Add the table to the day container
        } else {
            // If there is no data for the day
            const noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'Jokių pavadavimų.';
            dayContainer.appendChild(noDataMessage); // Add the message to the container
        }

        absentTeachersContent.appendChild(dayContainer); // Add the day container to the content area
    });
}

// Function to fetch data for a specific day
async function getData(year, month, day) {
    try {
        const response = await fetch('/proxy', {
            method: 'POST', // Use POST method
            headers: {
                'Content-Type': 'application/json', // Set content type to JSON
            },
            body: JSON.stringify({ year, month, day }), // Send the date as JSON
        });

        const htmlText = await response.text(); // Get the response as text

        // Parse the HTML text into a DOM structure
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // Extract the table rows from the .gallery table
        const rows = doc.querySelectorAll('.gallery tr');

        // Organize the data into a grouped structure
        const data = {};
        let lastTeacher = ''; // Keep track of the last teacher's name
        Array.from(rows).forEach(row => {
            const columns = row.querySelectorAll('td'); // Get all columns in the row
            if (columns.length > 0) {
                const teacher = columns[2]?.querySelector('font')?.textContent.trim() || lastTeacher; // Get the teacher's name
                const lesson = columns[3]?.querySelector('div')?.textContent.trim()[0] || ''; // Get the lesson
                const className = columns[4]?.querySelector('div')?.textContent.trim() || ''; // Get the class
                const notes = columns[5]?.querySelector('div')?.textContent.trim() || ''; // Get the notes

                if (teacher) {
                    lastTeacher = teacher; // Update the last teacher's name
                    if (!data[teacher]) {
                        data[teacher] = []; // Initialize the teacher's data if not already present
                    }
                    data[teacher].push({ lesson, class: className, notes }); // Add the lesson data
                }
            }
        });
        return { date: `${year}-${month}-${day}`, data }; // Return the date and data
    } catch (error) {
        console.error("Error fetching data:", error); // Log any errors
        return { date: `${year}-${month}-${day}`, data: null }; // Return null data on error
    }
}