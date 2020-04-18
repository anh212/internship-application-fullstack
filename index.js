addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

class HeadTitleRewriter {
  constructor(attributeName) {
    this.attributeName = attributeName
  }

  element(element) {
    //Changing website title ('title')
    element.setInnerContent('My Take Home Project!');
  }
}

class TitleRewriter {
  constructor(attributeName) {
    this.attributeName = attributeName
    this.contentText = '';
  }

  element(element) {
    //Changing website title ('h1#title')
    element.setInnerContent('My Take Home Project Yay!');
  }
}

class DescriptionRewriter {
  constructor(attributeName) {
    this.attributeName = attributeName
  }

  element(element) {
    //Changing website description ('p#description')
    element.setInnerContent('Welcome to my take home project!');
  }
}

class URLRewriter {
  constructor(attributeName) {
    this.attributeName = attributeName
  }

  element(element) {
    //Changing website URL ('a#url')
    element.setAttribute('href', 'https://www.reddit.com/r/aww/');
    element.setInnerContent('Click for cute animals');
  }
}


const rewriter = new HTMLRewriter()
  .on('title', new HeadTitleRewriter('title'))
  .on('h1', new TitleRewriter('id'))
  .on('p', new DescriptionRewriter('id'))
  .on('a', new URLRewriter('href'));


async function getAPIResponse(url) {
  let APIHeaders = {
    method: 'GET',
    headers: {
      "Content-Type": "application/json"
    }
  };

  return fetch(url, APIHeaders)
    .then(response => {
      if (response.status === 200) {
        //Return the JSON of the response
        return response.json();

      } else {
        console.log("Response error");
        return response.text();
      }
    })
    .catch(error => {
      return new Response(error.stack || error)
    });
}

function fetchHTMLFromURL(fetchURL) {
  //Headers for requesting the HTML from the URLs
  let websiteHeaders = {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html'
    }
  }
  //Fetch one of the two URLs
  return fetch(fetchURL, websiteHeaders)
    .then(response => {
      if (response.status === 200) {
        //Return text from response
        return response.text();

      } else {
        console.log("Response error");
        return response.text();
      }
    })
    .then(data => {
      //Conver the plain text into HTML
      return new Response(data, {
        headers: { 'content-type': 'text/html' }
      })
    })
    .catch(error => {
      return new Response(error.stack || error)
    })
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = 'https://cfw-takehome.developers.workers.dev/api/variants';
  const NAME = 'take-home-project-experiment'

  //Get data for the different variants
  const initalResponse = await getAPIResponse(url)
  
  //CODE FOR COOKIES FROM CLOUDFLARE DOCS

  //Getting HTML responses from both of the variant URLs
  const VARIANT1 = await fetchHTMLFromURL(initalResponse.variants[0]);
  const VARIANT2 = await fetchHTMLFromURL(initalResponse.variants[1]);

  //A/B Testing
  // Determine which group this requester is in.
  const cookie = request.headers.get('cookie')
  if (cookie && cookie.includes(`${NAME}=variant1`)) {
      return rewriter.transform(VARIANT1);
  } else if (cookie && cookie.includes(`${NAME}=variant2`)) {
      return rewriter.transform(VARIANT2);
  } else {
      // if no cookie then this is a new client, decide a group and set the cookie
      let group = Math.random() < 0.5 ? 'variant1' : 'variant2' // 50/50 split
      let response = group === 'variant1' ? VARIANT1 : VARIANT2
      response.headers.append('Set-Cookie', `${NAME}=${group}; path=/`)
      return rewriter.transform(response);
  }
}