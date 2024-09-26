const { Plugin, MarkdownView } = require('obsidian');

module.exports = class DynamicDatePlugin extends Plugin {
  dateElements = [];

  async onload() {
    console.log("Loading Dynamic Date Plugin");

    // Add a command to open the inline date picker
    this.addCommand({
      id: 'open-date-picker',
      name: 'Insert Dynamic Date',
      callback: () => this.openDatePicker()
    });

    // Register markdown post processor to render dynamic dates
    this.registerMarkdownCodeBlockProcessor('dynamicdate', (source, el, ctx) => {
      const selectedDate = this.parseDateToLocalTime(source.trim());
      this.renderDynamicDate(el, selectedDate);
      this.dateElements.push({ el, selectedDate });
    });

    // Set an interval to refresh the dynamic dates every 5 minutes
    this.interval = setInterval(() => this.updateDynamicDates(), 5 * 60 * 1000); // 5 minutes
  }

  onunload() {
    console.log("Unloading Dynamic Date Plugin");

    // Clear the interval when the plugin is unloaded
    clearInterval(this.interval);
  }

  updateDynamicDates() {
    console.log("Updating dynamic dates...");
    this.dateElements.forEach(({ el, selectedDate }) => {
      el.innerHTML = ''; // Clear current content
      this.renderDynamicDate(el, selectedDate); // Re-render the date
    });
  }

  // Parse the input date string and adjust it to local time
  parseDateToLocalTime(dateString) {
    const utcDate = new Date(dateString);
    const localDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
    return localDate;
  }

  // Date picker logic - now inline
  openDatePicker() {
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView).editor;

    // Create the inline date picker element
    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.style.position = 'absolute';
    datePicker.style.zIndex = '1000'; // Ensures it shows above other content
    datePicker.style.marginTop = '10px';

    // Append the date picker to the body
    document.body.appendChild(datePicker);

    // Position the date picker near the cursor
    const cursor = editor.coordsAtPos(editor.getCursor());
    datePicker.style.left = `${cursor.left}px`;
    datePicker.style.top = `${cursor.bottom}px`;

    // Flag to ensure we only remove the date picker once
    let datePickerRemoved = false;

    // Handle date selection
    datePicker.addEventListener('change', () => {
      if (!datePickerRemoved) {
        const selectedDate = new Date(datePicker.value);
        this.insertDateIntoMarkdown(selectedDate);
        datePicker.remove(); // Remove the date picker after date selection
        datePickerRemoved = true;
      }
    });

    // Automatically remove the date picker if it loses focus
    datePicker.addEventListener('blur', () => {
      if (!datePickerRemoved) {
        datePicker.remove(); // Remove the date picker on blur
        datePickerRemoved = true;
      }
    });

    // Set focus to the date picker so the user can immediately interact with it
    datePicker.focus();
  }

  // Insert the selected date into the markdown as a custom block
  insertDateIntoMarkdown(selectedDate) {
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView).editor;
    const markdown = `\`\`\`dynamicdate\n${selectedDate.toISOString()}\n\`\`\``;
    editor.replaceSelection(markdown);
  }

  // Format the date based on the current year
  formatDate(selectedDate) {
    const now = new Date();
    const options = {
      month: 'short', day: 'numeric', year: 'numeric'
    };

    // Remove year if the selected date is in the current year
    if (selectedDate.getFullYear() === now.getFullYear()) {
      delete options.year;
    }

    const weekday = selectedDate.toLocaleDateString(undefined, { weekday: 'short' });
    const formattedDate = selectedDate.toLocaleDateString(undefined, options);

    return `${weekday}, ${formattedDate}`;
  }

  // Render dynamic date based on the selected date using local timezone
  renderDynamicDate(el, selectedDate) {
    const now = new Date();
    const timeDiff = selectedDate - now;
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let resultText = "";
    let labelColor = "";
    let textColor = "";
    
    if (daysDiff === 0) {
      resultText = "Today";
      labelColor = "#8E44AD";
      textColor = "white";
    } else if (daysDiff === 1) {
      resultText = "Tomorrow";
      labelColor = "#8E44AD";
      textColor = "white";
    } else if (daysDiff < 0) {
      const formattedDate = this.formatDate(selectedDate);
      resultText = `${formattedDate}  (${Math.abs(daysDiff)} days ago)`;
      labelColor = "#404040";
      textColor = "DBDBDB";
    } else {
      const formattedDate = this.formatDate(selectedDate);
      resultText = `${formattedDate} (${daysDiff} days left)`;
      labelColor = "black";
      textColor = "white";
    }

    const label = document.createElement('div');
    label.className = 'dynamic-date-label';

    const icon = document.createElement('span');
    icon.className = 'lucide-icon';
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" class="lucide lucide-calendar-days" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>`;    icon.style.marginRight = '6px';

    label.appendChild(icon);

    const text = document.createElement('span');
    text.innerText = resultText;
    label.appendChild(text);

    label.style.display = 'inline-flex';
    label.style.alignItems = 'center';
    label.style.padding = '3px 6px';
    label.style.borderRadius = '8px';
    label.style.border = '1px solid gray';
    label.style.backgroundColor = labelColor;
    label.style.color = textColor;
    label.style.fontWeight = 'bold';
    label.style.fontSize = '12px';
    label.style.margin = '2px';
    label.style.textAlign = 'center';

    el.appendChild(label);
  }
};