export const mockHtmlData = {
  homepage: `
    <div class="deslide-wrap">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <div class="deslide-cover">
            <img class="film-poster-img" data-src="https://example.com/poster.jpg">
          </div>
          <div class="desi-head-title">Spotlight Anime</div>
          <div class="desi-description">Description text</div>
          <div class="desi-buttons">
            <a href="/watch/spotlight-123"></a>
          </div>
          <div class="sc-detail">
            <span class="scd-item">TV</span>
            <span class="scd-item">24m</span>
            <span class="scd-item m-hide">Oct 1, 2023</span>
            <span class="tick-sub">12</span>
            <span class="tick-dub">10</span>
            <span class="tick-eps">12</span>
          </div>
        </div>
      </div>
    </div>
    <div id="tl-trending">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <div class="tl-card" data-id="trending-456">
            <div class="tl-rank-bar">
              <span class="tl-rank-num">01</span>
              <div class="tl-rank-title dynamic-name" data-title="Trending Anime" data-jname="Trending Alt">Trending Anime</div>
            </div>
            <a href="/trending-456" class="tl-poster-link" title="Trending Anime">
              <img data-src="https://example.com/trending.jpg" class="tl-poster-img">
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="anif-blocks">
      <div class="row">
        <div class="anif-block">
          <div class="anif-block-header">Most Popular</div>
          <div class="anif-block-ul">
            <ul>
              <li>
                <div class="film-poster">
                  <img class="film-poster-img" data-src="https://example.com/popular.jpg">
                </div>
                <div class="film-detail">
                  <h3 class="film-name"><a href="/watch/popular-789" title="Popular Anime"></a></h3>
                  <div class="fd-infor">
                    <span class="fdi-item">TV</span>
                    <span class="fdi-item">24m</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  detail: `
    <div id="ani_detail">
      <div class="anis-content">
        <div class="film-poster">
          <img class="film-poster-img" src="https://example.com/detail.jpg">
          <div class="tick-rate">18+</div>
        </div>
        <div class="anisc-detail">
          <h2 class="film-name">Detail Anime</h2>
          <div class="film-stats">
            <div class="tick">
              <span class="item">TV</span>
              <span class="tick-sub">12</span>
              <span class="tick-dub">10</span>
              <span class="tick-eps">12</span>
            </div>
          </div>
          <div class="film-buttons">
            <a href="/watch/detail-123" class="btn"></a>
          </div>
        </div>
        <div class="anisc-info-wrap">
          <div class="anisc-info">
            <div class="item">
              <span class="item-head">Japanese:</span>
              <span class="name">日本語</span>
            </div>
            <div class="item">
              <span class="item-head">Aired:</span>
              <span class="name">Oct 1, 2023 to ?</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  search: `
    <div class="block_area-content block_area-list film_list">
      <div class="film_list-wrap">
        <div class="flw-item">
          <div class="film-poster">
            <img class="film-poster-img" data-src="https://example.com/search.jpg">
            <a href="/watch/search-123"></a>
          </div>
          <div class="film-detail">
            <h3 class="film-name"><a class="dynamic-name" href="/watch/search-123">Search Result</a></h3>
            <div class="fd-infor">
               <span class="fdi-item">TV</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  news: `
    <div class="zr-news-list">
      <div class="item">
        <a class="zrn-title" href="/news/news-123"></a>
        <h3 class="news-title">News Title</h3>
        <div class="description">News description</div>
        <img class="zrn-image" src="https://example.com/news.jpg">
        <div class="time-posted">Oct 1, 2023</div>
      </div>
    </div>
  `,
  schedule: {
    '2026-10-06': [
      {
        id: 16593,
        slug: 'scheduled-anime-16593',
        title: 'Scheduled Anime',
        name: 'Scheduled Anime',
        alternativeTitle: 'Scheduled Alt',
        episode: 5,
        episodes: { sub: 0, dub: 0, eps: 4 },
        time: '10:00',
      },
    ],
  },
  episodes: {
    success: true,
    episodes: [
      {
        id: '1',
        number: 1,
        titles: { en: 'Episode 1', romaji: 'Ep 1 Alt', ja: 'Ep 1 JA' },
        title: null,
        alternativeTitle: null,
        sub: true,
        dub: false,
        embed_id: '2142',
        ani: '21/1',
        mal: '21/1',
        filler: false,
      },
    ],
  },
  characterDetail: `
    <div class="actor-page-wrap">
      <div class="avatar">
        <img src="https://example.com/char-detail.jpg">
      </div>
      <div class="apw-detail">
        <div class="name">Character Full Name</div>
        <div class="sub-name">Character Japanese Name</div>
        <div class="tab-content">
          <div id="bio">
            <div class="bio"><p>Character biography</p></div>
          </div>
        </div>
      </div>
    </div>
  `,
  suggestions: {
    success: true,
    response: [
      {
        id: 12,
        slug: 'suggest-1',
        title: 'S1',
        alternativeTitle: 'S1 Alt',
        poster: 'https://example.com/s1.jpg',
        images: { poster: 'https://example.com/s1.jpg' },
        year: 1999,
        type: 'TV',
        duration: '24m',
      },
    ],
  },
  charactersJson: {
    anime_id: 12,
    total: 1,
    data: [
      {
        id: 1480,
        slug: '1480-character-name',
        name: { full: 'Character Name', native: 'キャラ' },
        image: 'https://example.com/character.jpg',
        role: 'MAIN',
        voice_actors: [
          {
            id: 7111,
            slug: '7111-va-name',
            name: { full: 'VA Name' },
            image: 'https://example.com/va.jpg',
            language: 'Japanese',
          },
        ],
      },
    ],
  },
  serversJson: {
    sub: [
      { serverId: '1-s1', serverName: 's-1', index: 3 },
      { serverId: '1-s2', serverName: 's-2', index: 2 },
    ],
    dub: [],
  },
  topSearch: `
    <div class="xhashtag">
      <a class="item" href="/watch/top-1">T1</a>
      <a class="item" href="/watch/top-2">T2</a>
      <a class="item" href="/watch/top-123">Top Title</a>
    </div>
  `,
  scheduleNext: {
    success: true,
    episode: 1181,
    airing_at_iso: '2027-01-03T14:16:00.000Z',
    timeUntilAiring: 7707558,
  },
};
