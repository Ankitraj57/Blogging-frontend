import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import "../styles/Home.css";

const posts = [
  {
    id: 1,
    title: "How to Master React in 2025",
    excerpt:
      "Learn the latest React tips, tricks, and best practices to build scalable apps.",
    author: "Ankit",
    date: "July 5, 2025",
  },
  {
    id: 2,
    title: "Node.js Performance Optimization",
    excerpt:
      "Boost your Node.js backend with these optimization strategies and tools.",
    author: "Ankit",
    date: "June 30, 2025",
  },
  {
    id: 3,
    title: "CSS Grid vs Flexbox: When to Use Which",
    excerpt:
      "A detailed comparison between CSS Grid and Flexbox for modern layouts.",
    author: "Ankit",
    date: "June 25, 2025",
  },
];

const categories = [
  { name: "Technology", count: 25, icon: "💻", color: "rgba(97, 218, 251, 0.2)" },
  { name: "Web Development", count: 18, icon: "🌐", color: "rgba(21, 114, 182, 0.2)" },
  { name: "Programming", count: 22, icon: "👨‍💻", color: "rgba(118, 74, 188, 0.2)" },
  { name: "Mobile Apps", count: 15, icon: "📱", color: "rgba(77, 168, 86, 0.2)" },
  { name: "UI/UX Design", count: 12, icon: "🎨", color: "rgba(247, 92, 3, 0.2)" },
  { name: "Cloud Computing", count: 10, icon: "☁️", color: "rgba(255, 193, 7, 0.2)" },
  { name: "Data Science", count: 14, icon: "📊", color: "rgba(0, 188, 212, 0.2)" },
  { name: "DevOps", count: 9, icon: "🛠️", color: "rgba(233, 30, 99, 0.2)" },
  { name: "Cybersecurity", count: 8, icon: "🔒", color: "rgba(0, 150, 136, 0.2)" },
  { name: "AI & ML", count: 16, icon: "🤖", color: "rgba(156, 39, 176, 0.2)" },
  { name: "Blockchain", count: 7, icon: "⛓️", color: "rgba(63, 81, 181, 0.2)" },
  { name: "Career Tips", count: 11, icon: "💼", color: "rgba(0, 150, 136, 0.2)" },
];

function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  return (
    <main className="home-container">
      <section className="hero-section">
        <div className="hero-text">
          <h1>Welcome to DevBlog</h1>
          <p>Your daily dose of web development tutorials, tips, and insights.</p>
          <Link to="/register" className="btn-primary">
            Get Started
          </Link>
        </div>
        <div className="hero-image">
          {/* You can replace this with an actual image or SVG */}
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80"
            alt="coding illustration"
          />
        </div>
      </section>

      <section className="posts-section">
        <h2>Latest Posts</h2>
        <div className="posts-grid">
          {posts.map((post) => (
            <article key={post.id} className="post-card">
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <div className="post-meta">
                <span>By {post.author}</span>
                <span>{post.date}</span>
              </div>
              <Link to={`/posts/${post.id}`} className="read-more">
                Read More →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="sidebar">
        <div className="categories-widget">
          <div className="widget-header">
            <h3>Explore Categories</h3>
            <span className="widget-subtitle">Browse by topic</span>
          </div>
          <div className="categories-list">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/category/${category.name.toLowerCase()}`}
                className={`category-item ${
                  selectedCategory === category.name ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <span className="category-icon" style={{ background: category.color }}>
                  {category.icon}
                </span>
                <div className="category-content">
                  <span className="category-name">{category.name}</span>
                  <span className="category-meta">{category.count} Posts</span>
                </div>
                <FaChevronRight className="category-arrow" />
              </Link>
            ))}
          </div>
          <div className="widget-footer">
            <Link to="/categories" className="view-all-link">
              View all categories <FaChevronRight style={{ fontSize: "12px" }} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home;
