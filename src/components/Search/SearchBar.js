import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { searchBlogs, filterByCategory, filterByAuthor } from '../../redux/slices/searchSlice';
import { Box, Input, Button, Select, IconButton, useDisclosure, 
         Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, 
         ModalFooter, FormControl, FormLabel, FormErrorMessage } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

const SearchBar = () => {
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [error, setError] = useState('');

  const { categories, authors } = useSelector(state => state.search);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    setError('');
    dispatch(searchBlogs(searchQuery));
  };

  const handleCategoryFilter = async () => {
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }
    setError('');
    dispatch(filterByCategory(selectedCategory));
  };

  const handleAuthorFilter = async () => {
    if (!selectedAuthor) {
      setError('Please select an author');
      return;
    }
    setError('');
    dispatch(filterByAuthor(selectedAuthor));
  };

  return (
    <Box p="4">
      <Box mb="4">
        <form onSubmit={handleSearch}>
          <Box display="flex" alignItems="center" gap="2">
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              flex="1"
            />
            <Button
              type="submit"
              leftIcon={<SearchIcon />}
              colorScheme="blue"
            >
              Search
            </Button>
          </Box>
        </form>
        {error && (
          <Text color="red.500" mt="2">
            {error}
          </Text>
        )}
      </Box>

      <Button
        onClick={onOpen}
        colorScheme="blue"
        variant="outline"
        leftIcon={<SearchIcon />}
      >
        Advanced Search
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Advanced Search</ModalHeader>
          <ModalBody>
            <FormControl isInvalid={error}>
              <FormLabel>Category</FormLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>

            <FormControl mt="4" isInvalid={error}>
              <FormLabel>Author</FormLabel>
              <Select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
              >
                <option value="">Select author</option>
                {authors.map(author => (
                  <option key={author._id} value={author._id}>
                    {author.name}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{error}</FormErrorMessage>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleCategoryFilter} mr={3}>
              Filter by Category
            </Button>
            <Button colorScheme="blue" onClick={handleAuthorFilter}>
              Filter by Author
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SearchBar;
