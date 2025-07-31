const { createClient } = require('@supabase/supabase-js')

// Test script to verify search functionality
async function testSearch() {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('🔍 Testing search functionality for removed albums...\n')

  // Test 1: Search with includeRemoved=false (default behavior)
  console.log('Test 1: Standard search (includeRemoved=false)')
  console.log('Query: "In Waves Jamie xx"')
  
  let dbQuery = supabase.from('albums').select('*')
  dbQuery = dbQuery.eq('removed', false)
  
  const searchTerm = 'In Waves Jamie xx'
  const searchQuery = `title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`
  dbQuery = dbQuery.or(searchQuery)
  
  const { data: standardResults, error: standardError } = await dbQuery
  
  if (standardError) {
    console.log('❌ Error:', standardError.message)
  } else {
    console.log(`✅ Found ${standardResults.length} albums`)
    standardResults.forEach(album => {
      console.log(`   - "${album.title}" by ${album.artist} (removed: ${album.removed})`)
    })
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 2: Search with includeRemoved=true (agent behavior)
  console.log('Test 2: Agent search (includeRemoved=true)')
  console.log('Query: "In Waves Jamie xx"')
  
  let agentQuery = supabase.from('albums').select('*')
  // Note: NOT filtering by removed=false
  
  agentQuery = agentQuery.or(searchQuery)
  
  const { data: agentResults, error: agentError } = await agentQuery
  
  if (agentError) {
    console.log('❌ Error:', agentError.message)
  } else {
    console.log(`✅ Found ${agentResults.length} albums`)
    agentResults.forEach(album => {
      console.log(`   - "${album.title}" by ${album.artist} (removed: ${album.removed})`)
    })
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 3: Search for individual terms
  console.log('Test 3: Individual term searches')
  
  const terms = ['In Waves', 'Jamie xx']
  
  for (const term of terms) {
    console.log(`\nSearching for: "${term}"`)
    
    let termQuery = supabase.from('albums').select('*')
    const termSearchQuery = `title.ilike.%${term}%,artist.ilike.%${term}%`
    termQuery = termQuery.or(termSearchQuery)
    
    const { data: termResults, error: termError } = await termQuery
    
    if (termError) {
      console.log('❌ Error:', termError.message)
    } else {
      console.log(`✅ Found ${termResults.length} albums`)
      termResults.forEach(album => {
        console.log(`   - "${album.title}" by ${album.artist} (removed: ${album.removed})`)
      })
    }
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 4: Direct database query for the specific album
  console.log('Test 4: Direct search for albums with "In Waves" and "Jamie xx"')
  
  let directQuery = supabase.from('albums').select('*')
  directQuery = directQuery.or('title.ilike.%In Waves%,artist.ilike.%Jamie xx%')
  
  const { data: directResults, error: directError } = await directQuery
  
  if (directError) {
    console.log('❌ Error:', directError.message)
  } else {
    console.log(`✅ Found ${directResults.length} albums`)
    directResults.forEach(album => {
      console.log(`   - "${album.title}" by ${album.artist} (removed: ${album.removed})`)
    })
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // Test 5: Check the actual search patterns from search-service.ts
  console.log('Test 5: Testing actual search patterns from search-service.ts')
  
  const searchTerm2 = 'In Waves Jamie xx'
  const searchQueries = [
    // Exact phrase match
    `title.ilike.%${searchTerm2}%,artist.ilike.%${searchTerm2}%`,
    // Individual words
    ...searchTerm2.split(' ').map(word => `title.ilike.%${word}%,artist.ilike.%${word}%`),
    // Combined with wildcards
    `title.ilike.%${searchTerm2.split(' ').join('%')}%,artist.ilike.%${searchTerm2.split(' ').join('%')}%`
  ]

  console.log('Search patterns generated:')
  searchQueries.forEach((pattern, index) => {
    console.log(`  ${index + 1}. ${pattern}`)
  })

  // Test the first (most specific) pattern as used in the service
  console.log(`\nTesting pattern 1: ${searchQueries[0]}`)
  
  let patternQuery = supabase.from('albums').select('*')
  patternQuery = patternQuery.or(searchQueries[0])
  
  const { data: patternResults, error: patternError } = await patternQuery
  
  if (patternError) {
    console.log('❌ Error:', patternError.message)
  } else {
    console.log(`✅ Found ${patternResults.length} albums`)
    patternResults.forEach(album => {
      console.log(`   - "${album.title}" by ${album.artist} (removed: ${album.removed})`)
    })
  }
}

// Run the test
testSearch().catch(console.error)