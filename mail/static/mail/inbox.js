document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archive').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(type='compose', reply_mail=null) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#box-heading').textContent = '';
  document.querySelector('#view-single-mail').style.display = 'none';

  // Change title to compose
  let compose_heading = document.createElement('div');
  compose_heading.id = 'box-title';

  // Pre-populate fields for reply mail
  if (type === 'reply') {
    compose_heading.innerHTML = "<h1>Reply Email</h1>";
    document.querySelector('#compose-recipients').value = reply_mail.sender;
    if (reply_mail.subject.slice(0, 3) === 'Re:') {
      document.querySelector('#compose-subject').value = `${reply_mail.subject}`;
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${reply_mail.subject}`;
    }
    document.querySelector('#compose-body').value = `On ${reply_mail.timestamp}, ${reply_mail.sender} wrote:\n\n${reply_mail.body}`;
  }

  // Clear out composition fields
  else {
    compose_heading.innerHTML = "<h1>Compose Email</h1>";
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';  
  }
  document.querySelector('#box-heading').appendChild(compose_heading)

  document.querySelector('#compose-form').addEventListener('submit', function(e) {
    
    // To stop page from regreshing after POST request
    e.preventDefault();
    
    // Send POST request and show to sent mailbox
    send_mail(e);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#box-heading').style.display = 'block';
  document.querySelector('#view-single-mail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Empty inbox and box heading div
  document.querySelector('#box-heading').textContent = '';
  document.querySelector('#emails-view').textContent = '';

  // Change side panel style based on mailbox
  let highlight_gray = 'rgb(173, 173, 173)';
  let mailboxes = ['inbox', 'sent', 'archive'];

  // Set different style for selected mailbox
  document.querySelector(`#${mailbox}`).style.backgroundColor = highlight_gray;
  document.querySelector(`#${mailbox}`).style.color = 'black';
  document.querySelector(`#side-${mailbox}-div`).style.backgroundColor = highlight_gray;
  document.querySelector(`#${mailbox}-icon`).style.filter = 'brightness(0.10)';

  // Set defined CSS style if not selected
  mailboxes.forEach((mail_box) => {
    if (mailbox !== mail_box) {
      document.querySelector(`#${mail_box}`).style.backgroundColor = null;
      document.querySelector(`#${mail_box}`).style.color = null;
      document.querySelector(`#side-${mail_box}-div`).style.backgroundColor = null;
      document.querySelector(`#${mail_box}-icon`).style.filter = null;
    }
  })

  // Show the mailbox name
  let heading = document.createElement('div');
  heading.id = 'box-title';
  heading.innerHTML = `<h1>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h1>`;  
  document.querySelector('#box-heading').appendChild(heading);
  
  
  // Populate inbox
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(mails => {
    mails.forEach(mail => {
      
      // Div for each mail.
      let div = document.createElement('div');
      let sender_div = document.createElement('div');
      let subject_div = document.createElement('div');
      let body_div = document.createElement('div');
      let timestamp_div = document.createElement('div');
      
      // Add classes to all newly created elements
      sender_div.innerHTML = mail.sender;
      sender_div.classList.add('sender-div');
      subject_div.innerHTML = mail.subject;
      subject_div.classList.add('subject-div');
      body_div.innerHTML = String(`- ${mail.body}`);
      body_div.classList.add('mail-body-div');
      timestamp_div.innerHTML = mail.timestamp;
      timestamp_div.classList.add('timestamp-div');
      div.classList.add('inbox-mail-div');
      
      // If the mail is read, let it appear in gray background
      if (mail.read) {
        div.style.backgroundColor = 'rgb(37, 37, 37)';
      }
      
      // Make the entire div clickable
      div.addEventListener('click', () => open_mail(mail, mailbox))
      div.style.cursor = 'pointer';

      // Append all parts of mail to the inner div
      div.appendChild(sender_div);
      div.appendChild(subject_div);
      div.appendChild(body_div);
      div.appendChild(timestamp_div);

      // Append the div the emails view
      document.querySelector('#emails-view').appendChild(div);


      // Archive button for each mail
      let archive_button = document.createElement('button');
      archive_button.classList.add('archive_button');
      if (mailbox === 'archive') {
        archive_button.innerHTML = "Unarchive";
      }
      else{
        archive_button.innerHTML = "Archive";
      }
      archive_button.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle_archive_mail(mail)
      });
      archive_button.style.display = 'none';
      div.append(archive_button);
      
      // Make archive button appear and disappear
      div.addEventListener('mouseover', () => {
        archive_button.style.display = 'flex';
        timestamp_div.style.display = 'none';
        subject_div.style.marginLeft = '10px;'
      })
      div.addEventListener('mouseout', () => {
        archive_button.style.display = 'none';
        timestamp_div.style.display = 'block';
      })

      // Reply button for each mail
      if (mailbox !== 'sent') {
        let reply_button = document.createElement('button');
        reply_button.id = 
        reply_button.style.display = 'none';
        reply_button.innerHTML = "Reply";
        reply_button.classList.add('reply_button');
        reply_button.addEventListener('click', (e) => {
          e.stopPropagation(); 
          compose_email('reply', mail);
          toggle_read_mail(mail.id);
        });
        // Make reply button appear and disappear
        div.addEventListener('mouseover', () => {
          reply_button.style.display = 'flex';
          timestamp_div.style.display = 'none';
        })
        div.addEventListener('mouseout', () => {
          reply_button.style.display = 'none';
          timestamp_div.style.display = 'block';
        })
        // Append the button to emails-view
        div.appendChild(reply_button);
      }
    })
  }); 
}

function open_mail(mail, mailbox) {
  
  // Hide inbox view and show single mail view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#view-single-mail').style.display = 'block';
  document.querySelector('#view-single-mail').textContent = '';

  // Fetch the clicked mail and display inside single mail view
  fetch(`emails/${mail.id}`)
  .then(response => response.json())
  .then(response_mail => {

    // Adding the parts of the email
    let subject_div = document.createElement('div');
    subject_div.id = 'mail-subject-div';
    let body_div = document.createElement('div');
    body_div.id = 'mail-body-div';
    let info_div = document.createElement('div');
    info_div.id = 'mail-info-div';
    subject_div.innerHTML = `<h2>${response_mail.subject}</h2>`
    info_div.innerHTML = `<h4>From: ${response_mail.sender}</h4><h4>To: ${response_mail.recipients}</h4><h4>${response_mail.timestamp}</h4>`;
    body_div.innerHTML = response_mail.body;
    body_div.innerHTML = body_div.innerHTML.replace(/\n/g, '<br>\n');
    
    // Adding the archive button 
    let archive_button = document.createElement('button');
    archive_button.id = "archive-button";
    let action_button_div = document.createElement('div');
    action_button_div.id = "action-button-div";
    if (response_mail.archived) {
      archive_button.innerHTML = "Unarchive"
    }
    else {
      archive_button.innerHTML = "Archive";
    }
    archive_button.addEventListener('click', () => toggle_archive_mail(response_mail));
    action_button_div.appendChild(archive_button);


    // Append all parts of mail to one div
    let view_mail_div = document.querySelector('#view-single-mail');
    view_mail_div.appendChild(subject_div);
    view_mail_div.appendChild(info_div);
    view_mail_div.appendChild(body_div);
    view_mail_div.appendChild(action_button_div);

    if (mailbox !== 'sent') {
      let reply_button = document.createElement('button');
      reply_button.innerHTML = "Reply";
      reply_button.id = "reply-button";
      reply_button.addEventListener('click', () => {
        compose_email('reply', mail);
      })
      action_button_div.appendChild(reply_button);
    }

    // To change read to true after user opens the mail
    toggle_read_mail(response_mail.id);
  })
}
    
function toggle_read_mail(mail_id) {
  fetch(`emails/${mail_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function toggle_archive_mail(response_mail) {
  
  // change state to true if false and vice versa
  let state;
  if (response_mail.archived) {
    state = false;
  }
  else {
    state = true;
  }

  // PUT request to change only one property
  fetch(`emails/${response_mail.id}`, {
    method: 'PUT', 
    body: JSON.stringify({
      archived: state
    })
  })
  .then(() => {
    load_mailbox('inbox');
  });
}

function send_mail(e) {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(() => load_mailbox('sent'));

  // To stop event from being called multiple times 
  e.stopPropagation();
  e.stopImmediatePropagation();
}
