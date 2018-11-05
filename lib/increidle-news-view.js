'use babel';

export default class IncreidleNewsView {

  news: null;
  news_interval: null;

  constructor(props) {
    this.props = props
    this.reload_news();
  }

  reload_news() {
    this.showMessage(); // Show default message
    clearInterval(this.news_interval);
    this.getData(this.showMessage, this.check_latest_news); // Show news
    this.news_interval = setInterval(function() {
      this.getData(this.showMessage, this.check_latest_news); // Show news
    }.bind(this), 5 * 60 * 1000); // reload every 5 minutes
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return {
      // This is used to look up the deserializer function. It can be any string, but it needs to be
      // unique across all packages!
      deserializer: 'increidle-news/IncreidleNewsView',
      test: this.props.test
    };
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
    this.subscriptions.dispose();
  }

  getElement() {
    return this.element;
  }

  getTitle() {
    // Used by Atom for tab text
    return 'Incre-IDLE Noticias';
  }

  getURI() {
    // Used by Atom to identify the view when toggling.
    return 'atom://increidle-news';
  }

  getDefaultLocation() {
    // This location will be used if the user hasn't overridden it by dragging the item elsewhere.
    // Valid values are "left", "right", "bottom", and "center" (the default).
    return 'bottom';
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ['bottom'];
  }

  showMessage(data=null){
    if(!data) {
      this.element = document.createElement('div');
      this.element.classList.add('increidle-news');

      // Header
      const message = document.createElement('div');
      message.setAttribute("id", "message");
      message.innerHTML = "<center><span class='loading loading-spinner-small inline-block'></span></br>Obteniendo información del servidor. Espere mientras se cargan las noticias.</center>";
      this.element.appendChild(message);

      // Content
      const news_message = document.createElement('div');
      news_message.setAttribute("id", "news_message");
      news_message.setAttribute("class", "padded");
      this.element.appendChild(news_message);
    } else {
      const message = document.getElementById("message");
      const subjects_list = document.createElement('div');

      // Check if system has subjects
      if (data.length == 0) {
        const no_result = document.createElement("ul")
        no_result.setAttribute("class", "background-message");
        no_result.innerHTML = "<li>No hay asignaturas registradas en el sistema.</li>";
        subjects_list.appendChild(no_result);
      }
      subjects_list.setAttribute("class", "btn-group");
      // Getting subject list
      for(let subject of data) {
        const subject_btn = document.createElement('button');
        subject_btn.setAttribute("class", "btn");
        subject_btn.setAttribute("name", "subject");
        subject_btn.setAttribute("id", subject.pk + "btn");
        subject_btn.innerHTML = subject.name;
        subjects_list.appendChild(subject_btn);
      }
      message.innerHTML = "<center><div class='text-highlight'>Selecciona la asignatura que desees visualizar</div></br>" + subjects_list.innerHTML + "</center>";

      // Adding subject event listener after innerHTML
      for (subject of data) {
        document.getElementById(subject.pk + "btn").addEventListener("click", function(event) {
          const btn_id = event.target.id;
          const news_message = document.getElementById("news_message");
          news_message.innerHTML = ""; // Clear news

          // Subject title
          const subject_selected = document.createElement('h3');
          subject_selected.innerHTML = "Noticias de " + event.target.textContent;
          news_message.appendChild(subject_selected);
          for(let elem of this.news) {
            // pk, name, news
            // search for subject selected
            if ( elem.pk+"btn" == btn_id ) {
              // check if subject has news
              if (elem.news.length == 0) {
                const no_result = document.createElement("ul")
                no_result.setAttribute("class", "background-message");
                no_result.innerHTML = "<li>No hay noticias para este curso.</li>";
                news_message.appendChild(no_result);
              } else {
                for ( let news of elem.news) {
                  // pk, title, description, date
                  const panel = document.createElement('div');
                  panel.setAttribute("class","inset-panel");
                  const heading = document.createElement('div');
                  heading.setAttribute("class", "panel-heading");
                  heading.innerHTML = "(" + news.date + ") " + news.title;
                  const body = document.createElement('div');
                  body.setAttribute("class", "panel-body padded");
                  body.innerHTML = news.description;
                  panel.appendChild(heading);
                  panel.appendChild(body);
                  news_message.appendChild(panel);
                  news_message.appendChild(document.createElement("br"));
                }
              }
            }
          }
        }.bind(this));
      }
    }

  }

  getData(showMessage, check_latest_news){
    url = 'http://127.0.0.1:8000/news/all/?format=json'
    fetch(url)
      .then(function (res) {
          return res.json();
      })
      .then(function (data) {
        // revisar nuevos news
          if (this.news != null) {
            check_latest_news(this.news, data);
          }
          this.news = data;
          showMessage(data);
      }).catch(function (err) {
          console.log(err);
          const message = document.getElementById("message");
          message.innerHTML = "<center><button id='fail_reload' class='btn btn-primary icon icon-repo-sync inline-block-tight'>Reintentar</button></br></br>No se logró conectar con el servidor de Incre-IDLE</center>"
          atom.notifications.addWarning("No se logró conectar con el servidor de Incre-IDLE para obtener las noticias");
          document.getElementById("fail_reload").addEventListener("click", function(event) {
            this.reload_news();
          }.bind(this));
      }.bind(this))
  }

  check_latest_news(older, latest) {
    if(older.length != latest.length) return;
    for(let index in latest) {
      // check and notificate for latest news
      if(older[index].news.length < latest[index].news.length) {
        let count = latest[index].news.length - older[index].news.length;
        for(let i=0; i<count; i++) {
          let news = latest[index].news[i];
          let subject = latest[index].name;
          atom.notifications.addInfo(subject, {
            detail: news.title + ": " + news.description
          })
        }
      }
    }
  }

}
