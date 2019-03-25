(function () {
    var notesAlive //to know how many notes are active
    let historicalIsShowing = false;

    // function addNote(titleText, noteText, creationDate, modify, barColor, status) {
    function addNote(template, note, status) {
        //variables to get the elements of the note
        let docFragment = template.cloneNode(true);
        let fullNote = docFragment.querySelector('.note');
        let title = docFragment.querySelector('.noteTitle'); // input of the note
        let text = docFragment.querySelector('.text'); // textarea of the note
        let whenCreated = docFragment.querySelector('.create'); // label date of creation
        let lastModify = docFragment.querySelector('.modify'); // label last modify

        //give initial values 
        title.value = note.titleText;
        text.value = note.noteText;
        whenCreated.innerText = note.creationDate;
        lastModify.innerText = note.modify;
        fullNote.id = note.id;

        //the note will be active and must have events
        if (status == 'alive') {
            let noteBarToChange = docFragment.querySelector('.noteBar');
            noteBarToChange.style.backgroundColor = note.barColor;
        }        
        else { //the note has been deleted and just need to be display
               //change the opacity and make the note content to be only read
            fullNote.style.opacity = 0.5;
            title.readOnly = true;
            text.readOnly = true;
        }

        return docFragment;
    }

    const colorRotation = {
        red: 'blue',
        blue: 'green',
        green: 'black',
        black: 'grey'
    };

    function changeColor(ev) {
        const target = ev.target;
        if (!target.classList.contains('colorBtn')) return;
        const bar = target.closest('.noteBar');
        const domNote = target.closest('.note');

        const notes = getNotesInMemory();
        const note = notes.find(function (n) { return n.id == domNote.id });

        if (bar && note) {
            note.barColor = colorRotation[note.barColor] || 'red';
            bar.style.backgroundColor = note.barColor;
            saveNotesInMemory(notes);
        }
    }

    function hideHandler(ev) {
        const target = ev.target;
        if (!target.classList.contains('hideBtn')) return;
        const domNote = target.closest('.note');
        if (domNote) {
            domNote.style.display = 'none';
        }

    }

    function deleteHandler(ev) {
        const target = ev.target;
        if (!target.classList.contains('deleteBtn')) return;

        const domNote = target.closest('.note');
        const notes = getNotesInMemory();
        const idx = notes.findIndex(function (n) { return n.id == domNote.id });
        if (idx != -1) {
            saveInHistory(notes[idx]);
            notes.splice(idx,1);
            saveNotesInMemory(notes);
            domNote.remove();
            notesAlive--;
        }
    }

    function setTitle(note, el) {
        note.titleText = el.value;
    }

    function setNoteText(note, el) {
        note.noteText = el.value;
    }

    function getAction(classList) {
        if (classList.contains('text')) return setNoteText;
        if (classList.contains('noteTitle')) return setTitle;
    }

    function changeText(ev) {
        const target = ev.target;
        let action = getAction(target.classList);
        if (action) {
            const domNote = target.closest('.note');
            const notes = getNotesInMemory();
            const note = notes.find(function (n) { return n.id == domNote.id });
            if (note) {                
                let today = new Date;
                note.modify = 'last modify: ' + 
                                  today.getDate() + '/' + 
                                  (today.getMonth()+1) + '/' + 
                                  today.getFullYear() + ' ' + 
                                  today.getHours() + ':' + 
                                  today.getMinutes() + ':' + 
                                  today.getSeconds();
                action(note, target);
                const modifyLbl = domNote.querySelector('.modify')
                modifyLbl.innerText = note.modify;
                saveNotesInMemory(notes);
            }
        }
    }

    function tabHandler(ev) {
        const target = ev.target;
        if (!target.classList.contains('text')) return;
        if (ev.keyCode == 9 || ev.which == 9) {
            ev.preventDefault();
            var start = target.selectionStart;
            var end = target.selectionEnd;
            target.value = target.value.substring(0, start) + "\t" + target.value.substring(end);
            target.selectionEnd = start + 1;
        }
    }
    function getNotesInHistory(){
        const rawHistory = localStorage.getItem('notesInHistory') || '[]';
        try{
            return JSON.parse(rawHistory);
        } catch {
            localStorage.setItem('notesInHistory', JSON.stringify([]));
            return [];
        }
    }

    function saveInHistory(noteToSave) {
        var history = getNotesInHistory();
        history.push(noteToSave);
        localStorage.setItem('notesInHistory', JSON.stringify(history));
    }

    function saveNotesInMemory(notes) {
        localStorage.setItem('notesInMemory', JSON.stringify(notes));
    }

    function getNotesInMemory() {
        const rawNotes = localStorage.getItem('notesInMemory') || '[]';
        let notes;
        try {
            notes = JSON.parse(rawNotes);
        } catch {
            notes = [];
            saveNotesInMemory(notes);
        }
        return notes;
    }

    function renderNotes(container, template, notes) {
        //create a note for each note in the array
        const frag = document.createDocumentFragment();
        for (let i = 0; i < notes.length; i++) {
            frag.appendChild(addNote(template, notes[i], 'alive'));
            //for each one we add to the count of notes
            notesAlive++;
        }
        container.append(frag);
    }

    function loadNotesInHistory(container, template, flag) {
        //if the history needs to be show
        if (flag == true) {
            //create the array with notes that are in memory
            const notesInHistoryArray = getNotesInHistory();
            const frag = document.createDocumentFragment();
            //create a note for each note in the array
            for (let i = 0; i < notesInHistoryArray.length; i++) {                
                let ghostNote = addNote(template, notesInHistoryArray[i], 'dead');
                frag.appendChild(ghostNote);
            }
            container.appendChild(frag);
            historicalIsShowing = true;
        }
        //if the history need to be hidden
        else {
            historicalIsShowing = false;
            let notesNodes = document.getElementsByClassName('note');

            while (notesNodes[notesAlive] != null) {
                notesNodes[notesAlive].remove();
            }
        }
    }

    window.onload = function () {
        const container = document.getElementById('container');
        const template = document.getElementById('template').content;
        
        notesAlive = container.childNodes.length;

        //setup events through delegation
        container.addEventListener('click', changeColor, false);
        console.log(changeColor);
        container.addEventListener('click', hideHandler, false);
        container.addEventListener('click', deleteHandler, false);

        container.addEventListener('change', changeText, false);
        container.addEventListener('keydown', tabHandler, false);

        //if there is a note in memory we call it 
        const notes = getNotesInMemory();
        renderNotes(container, template, notes);

        let btnShow = document.getElementById('showBtn');
        let btnAdd = document.getElementById('addBtn');
        let btnShowHistory = document.getElementById('historicalBtn');

        //we give the controls (addnote, showHistory, unhideNotes) the events 

        btnAdd.addEventListener('click', function () {
            let date = new Date;
            let fullDateString = 'Created: ' + date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();//+1 because its start in 0       
            let note = {
                id: date.getTime(),
                titleText: '',
                noteText: '',
                creationDate: fullDateString,
                modify: '',
                barColor: 'grey'
            }
            const notes = getNotesInMemory();
            notes.push(note);
            saveNotesInMemory(notes);
            container.appendChild(addNote(template, note, 'alive'));
            notesAlive++;
        });

        btnShow.addEventListener('click', function () {
            let notes = document.getElementsByClassName('note')
            for (let i = 0; i < notesAlive; i++) {
                notes[i].style.display = 'flex';
                notes[i].style.flexDirection = 'column';
            }
        });

        btnShowHistory.addEventListener('click', function () {
            loadNotesInHistory(container, template, !historicalIsShowing);
        });
    };
})();