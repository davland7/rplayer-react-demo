function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl text-center max-w-sm">
        <h1 className="text-3xl font-bold text-primary mb-4">
          Tailwind v4 + React
        </h1>
        <p className="text-gray-300 mb-6">
          Ceci est une démo rapide. Plus de config JS complexe, tout est géré automatiquement !
        </p>
        <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 active:scale-95 rounded-full transition-all font-semibold cursor-pointer">
          Ça marche 🚀
        </button>
      </div>
    </div>
  )
}

export default App