import { useEffect, useState } from 'react'
import './App.css'

const API = 'https://pokeapi.co/api/v2/pokemon'
const POR_PAGINA = 20

const TIPOS = {
  normal: { nombre: 'Normal', color: '#9fa19f' },
  fire: { nombre: 'Fuego', color: '#e62829' },
  water: { nombre: 'Agua', color: '#2980ef' },
  grass: { nombre: 'Planta', color: '#3fa129' },
  electric: { nombre: 'Eléctrico', color: '#fac000', texto: '#222' },
  ice: { nombre: 'Hielo', color: '#3dcef3', texto: '#222' },
  fighting: { nombre: 'Lucha', color: '#ff8000' },
  poison: { nombre: 'Veneno', color: '#9141cb' },
  ground: { nombre: 'Tierra', color: '#915121' },
  flying: { nombre: 'Volador', color: '#81b9ef' },
  psychic: { nombre: 'Psíquico', color: '#ef4179' },
  bug: { nombre: 'Bicho', color: '#91a119' },
  rock: { nombre: 'Roca', color: '#afa981' },
  ghost: { nombre: 'Fantasma', color: '#704170' },
  dragon: { nombre: 'Dragón', color: '#5060e1' },
  dark: { nombre: 'Siniestro', color: '#624d4e' },
  steel: { nombre: 'Acero', color: '#60a1b8' },
  fairy: { nombre: 'Hada', color: '#ef70ef' },
}

async function pedirJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.status === 404 ? 'no-encontrado' : `HTTP ${res.status}`)
  return res.json()
}

// Deja solo los datos que usamos de la respuesta de PokeAPI
function resumir(p) {
  return {
    id: p.id,
    nombre: p.name,
    imagen: p.sprites.other['official-artwork'].front_default ?? p.sprites.front_default,
    tipos: p.types.map((t) => t.type.name),
  }
}

function TarjetaPokemon({ pokemon }) {
  return (
    <li className="tarjeta">
      <span className="numero">#{String(pokemon.id).padStart(3, '0')}</span>
      {pokemon.imagen && <img src={pokemon.imagen} alt={pokemon.nombre} loading="lazy" />}
      <h2>{pokemon.nombre}</h2>
      <div className="tipos">
        {pokemon.tipos.map((tipo) => {
          const info = TIPOS[tipo] ?? { nombre: tipo, color: '#777' }
          return (
            <span
              key={tipo}
              className="tipo"
              style={{ background: info.color, color: info.texto ?? '#fff' }}
            >
              {info.nombre}
            </span>
          )
        })}
      </div>
    </li>
  )
}

function App() {
  const [pagina, setPagina] = useState(0)
  const [pokemons, setPokemons] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [texto, setTexto] = useState('')
  const [buscado, setBuscado] = useState(null)

  // Cada vez que cambia la página, pide la lista y luego el detalle de cada Pokémon
  useEffect(() => {
    let cancelado = false

    pedirJSON(`${API}?limit=${POR_PAGINA}&offset=${pagina * POR_PAGINA}`)
      .then(async (lista) => {
        const detalles = await Promise.all(lista.results.map((p) => pedirJSON(p.url)))
        if (cancelado) return
        setTotal(lista.count)
        setPokemons(detalles.map(resumir))
        setError('')
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar la lista. Revisa tu conexión.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [pagina])

  function cambiarPagina(nueva) {
    setCargando(true)
    setPagina(nueva)
  }

  async function buscar(e) {
    e.preventDefault()
    const consulta = texto.trim().toLowerCase()
    if (!consulta) return

    setCargando(true)
    setError('')
    try {
      setBuscado(resumir(await pedirJSON(`${API}/${consulta}`)))
    } catch (err) {
      setBuscado(null)
      setError(
        err.message === 'no-encontrado'
          ? `No existe ningún Pokémon con "${texto.trim()}".`
          : 'No se pudo conectar con PokeAPI.',
      )
    } finally {
      setCargando(false)
    }
  }

  function verTodos() {
    setBuscado(null)
    setTexto('')
    setError('')
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <main className="app">
      <h1>Pokédex</h1>

      <form className="buscador" onSubmit={buscar}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre o número (ej: pikachu, 25)"
          aria-label="Buscar Pokémon"
        />
        <button type="submit">Buscar</button>
        {buscado && (
          <button type="button" onClick={verTodos}>
            Ver todos
          </button>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="estado">Cargando...</p>
      ) : (
        <ul className="grilla">
          {(buscado ? [buscado] : pokemons).map((p) => (
            <TarjetaPokemon key={p.id} pokemon={p} />
          ))}
        </ul>
      )}

      {!buscado && totalPaginas > 0 && (
        <nav className="paginacion">
          <button onClick={() => cambiarPagina(pagina - 1)} disabled={cargando || pagina === 0}>
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            onClick={() => cambiarPagina(pagina + 1)}
            disabled={cargando || pagina + 1 >= totalPaginas}
          >
            Siguiente
          </button>
        </nav>
      )}
    </main>
  )
}

export default App
