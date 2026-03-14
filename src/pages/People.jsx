import { useState, useEffect } from "react";
import { getPopularPeople } from "../services/api";
import "../css/People.css";

function People() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);
      try {
        const data = await getPopularPeople(page);
        setPeople(prev => page === 1 ? data : [...prev, ...data]);
      } catch (error) {
        console.error("Failed to fetch people:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPeople();
  }, [page]);

  return (
    <div className="people-page">
      <div className="people-header-banner">
        <h1 className="people-title-premium">Popular People</h1>
        <p className="people-subtitle">Discover the faces behind the world's greatest stories.</p>
      </div>

      <div className="people-grid-premium">
        {people.map((person) => (
          <div key={person.id} className="person-card-liquid">
            <div className="person-img-wrap">
              <img 
                src={person.profile_path ? `https://image.tmdb.org/t/p/w235_and_h235_face${person.profile_path}` : "https://via.placeholder.com/235x235?text=No+Photo"} 
                alt={person.name} 
              />
            </div>
            <div className="person-info-liquid">
              <h3 className="person-name">{person.name}</h3>
              <p className="person-known-for">
                {person.known_for?.map(m => m.title || m.name).slice(0, 2).join(", ")}
              </p>
            </div>
            <div className="person-card-glow" />
          </div>
        ))}
      </div>

      {loading && <div className="people-loading-liquid">SHIMMING TALENT...</div>}
      
      {!loading && (
        <button className="load-more-people-btn" onClick={() => setPage(p => p + 1)}>
          LOAD MORE TALENT
        </button>
      )}
    </div>
  );
}

export default People;
