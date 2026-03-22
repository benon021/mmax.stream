import { useEffect, useState } from "react";
import "../css/PersonModal.css";
import { getPersonDetails } from "../services/api";

function PersonModal({ personId, onClose }) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchPerson = async () => {
      setLoading(true);
      try {
        const data = await getPersonDetails(personId);
        if (!cancelled) setPerson(data);
      } catch (err) {
        console.error("Failed to fetch person details", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPerson();

    return () => {
      cancelled = true;
    };
  }, [personId]);

  const profileUrl = person?.profile_path
    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
    : "https://via.placeholder.com/420x630?text=No+Photo";

  return (
    <div className="person-modal-overlay" onClick={onClose}>
      <div className="person-modal" onClick={(e) => e.stopPropagation()}>
        <button className="person-modal-close" onClick={onClose}>
          ✕
        </button>

        {loading ? (
          <div className="person-modal-loading">Loading...</div>
        ) : (
          <div className="person-modal-content">
            <div className="person-modal-header">
              <div className="person-modal-poster">
                <img src={profileUrl} alt={person?.name || "Person"} />
              </div>
              <div className="person-modal-info">
                <h2 className="person-modal-name">{person?.name}</h2>
                {person?.birthday && (
                  <p className="person-meta">
                    <span>Born:</span> {person.birthday}
                    {person.place_of_birth ? ` in ${person.place_of_birth}` : ""}
                  </p>
                )}
                {person?.known_for_department && (
                  <p className="person-meta">
                    <span>Known for:</span> {person.known_for_department}
                  </p>
                )}
                {person?.biography && (
                  <div className="person-bio">
                    <h3>Biography</h3>
                    <p>{person.biography}</p>
                  </div>
                )}
              </div>
            </div>

            {person?.combined_credits && (
              <div className="person-credits">
                <h3>Top Credits</h3>
                <div className="credits-grid">
                  {person.combined_credits.cast
                    ?.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                    .slice(0, 12)
                    .map((credit) => (
                      <div key={credit.credit_id || credit.id} className="credit-card">
                        <div className="credit-thumb">
                          <img
                            src={
                              credit.poster_path
                                ? `https://image.tmdb.org/t/p/w200${credit.poster_path}`
                                : "https://via.placeholder.com/200x300?text=No+Image"
                            }
                            alt={credit.title || credit.name}
                          />
                        </div>
                        <div className="credit-details">
                          <div className="credit-title">{credit.title || credit.name}</div>
                          <div className="credit-sub">{credit.character || credit.job || ""}</div>
                          <div className="credit-meta">{(credit.release_date || credit.first_air_date || "").slice(0, 4)}</div>
                        </div>
                      </div>
                    ))}
                </div>

                {person.combined_credits.cast?.length > 12 && (
                  <div className="person-other-movies">
                    <h3>Other Movies</h3>
                    <div className="credits-grid">
                      {person.combined_credits.cast
                        .filter((credit) => credit.media_type === "movie")
                        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                        .slice(0, 8)
                        .map((credit) => (
                          <div key={credit.credit_id || credit.id} className="credit-card">
                            <div className="credit-thumb">
                              <img
                                src={
                                  credit.poster_path
                                    ? `https://image.tmdb.org/t/p/w200${credit.poster_path}`
                                    : "https://via.placeholder.com/200x300?text=No+Image"
                                }
                                alt={credit.title || credit.name}
                              />
                            </div>
                            <div className="credit-details">
                              <div className="credit-title">{credit.title || credit.name}</div>
                              <div className="credit-meta">{(credit.release_date || "").slice(0, 4)}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonModal;
