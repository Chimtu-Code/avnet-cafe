import { supabase } from '../services/supabaseClient.js'
import { useEffect, useState } from 'react'

function Test() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')

    if (error) console.log('Error fetching categories:', error)
    else setCategories(data)
  }

  return (
    <div>
      <h1>Cafeteria Menu</h1>
      <ul>
        {categories.map((cat) => (
          <li key={cat.id}>{cat.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default Test
