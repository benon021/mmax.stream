import {createContext, useState, useContext, useEffect, useMemo, useCallback} from "react"

const MovieContext = createContext()

export const useMovieContext = () => useContext(MovieContext)

export const MovieProvider = ({children}) => {
    const [favorites, setFavorites] = useState([])

    useEffect(() => {
        const storedFavs = localStorage.getItem("favorites")

        if (storedFavs) setFavorites(JSON.parse(storedFavs))
    }, [])

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites))
    }, [favorites])

    const favoritesSet = useMemo(
        () => new Set(favorites.map((movie) => movie.id)),
        [favorites]
    )

    const addToFavorites = useCallback((movie) => {
        setFavorites((prev) =>
            prev.some((item) => item.id === movie.id) ? prev : [...prev, movie]
        )
    }, [])

    const removeFromFavorites = useCallback((movieId) => {
        setFavorites((prev) => prev.filter((movie) => movie.id !== movieId))
    }, [])
    
    const isFavorite = useCallback(
        (movieId) => favoritesSet.has(movieId),
        [favoritesSet]
    )

    const value = useMemo(
        () => ({
            favorites,
            addToFavorites,
            removeFromFavorites,
            isFavorite,
        }),
        [favorites, addToFavorites, removeFromFavorites, isFavorite]
    )

    return (
        <MovieContext.Provider value={value}>
            {children}
        </MovieContext.Provider>
    )
}