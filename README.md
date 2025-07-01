# DataMac 🧮

A modern, customizable mental math game inspired by Zetamac, built with Next.js and Supabase. Challenge yourself with timed arithmetic problems and compete on the global leaderboard!

![DataMac Screenshot](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=DataMac+Game)

## ✨ Features

### 🎮 **Customizable Game Modes**
- **Four Operations**: Addition, Subtraction, Multiplication, and Division
- **Flexible Ranges**: Set custom number ranges for each operation (e.g., 2-12 for multiplication tables)
- **Multiple Durations**: Choose from 30, 60, 90, 120, or 180 seconds
- **Selective Operations**: Enable/disable specific operations to focus on your weak areas

### 🏆 **Competitive Features**
- **Global Leaderboard**: See how you rank against other players worldwide
- **Profile Pictures**: Beautiful UI with Google OAuth profile pictures
- **Score Tracking**: Automatic score saving and average calculation
- **Real-time Updates**: Live leaderboard updates

### 🎯 **Smart Problem Generation**
- **Balanced Difficulty**: Intelligent problem generation based on your settings
- **Reverse Operations**: Subtraction and division problems are generated as reverse operations for better learning
- **Auto-advance**: Automatically moves to the next problem on correct answers
- **Input Validation**: Numeric-only input with proper mobile keyboard support

### 🎨 **Modern UI/UX**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Clean Interface**: Minimalist design focused on the math problems
- **Tailwind CSS**: Beautiful, consistent styling
- **Google Fonts**: Professional typography with Geist and Geist Mono

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel-ready
- **Fonts**: Geist and Geist Mono from Google Fonts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/datamac.git
   cd datamac
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Enable Google OAuth in Authentication settings
   - Create a `scores` table with the following schema:
     ```sql
     CREATE TABLE scores (
       id SERIAL PRIMARY KEY,
       user_id UUID REFERENCES auth.users(id),
       value INTEGER NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

1. **Configure Your Game**
   - Choose which operations to include (addition, subtraction, multiplication, division)
   - Set number ranges for each operation
   - Select game duration (30-180 seconds)

2. **Start Playing**
   - Click "Start Game" to begin
   - Solve math problems as quickly as possible
   - Type your answer and press Enter (or it will auto-advance on correct answers)

3. **Track Progress**
   - View your score in real-time
   - Check the global leaderboard
   - Compare your performance with other players

## 📊 Game Configuration Examples

### **Beginner Mode**
- Addition: 1-20
- Subtraction: 1-20
- Duration: 60 seconds

### **Multiplication Tables**
- Multiplication: 2-12 × 2-12
- Duration: 120 seconds

### **Advanced Mode**
- All operations enabled
- Addition: 1-100
- Subtraction: 1-100
- Multiplication: 2-20 × 2-50
- Division: 2-20 ÷ 2-100
- Duration: 180 seconds

## 🏗️ Project Structure

```
zetamac/
├── components/
│   └── OperationConfigSection.tsx  # Reusable operation configuration component
├── pages/
│   ├── index.tsx                   # Main game configuration page
│   ├── game.tsx                    # Game interface
│   ├── _app.tsx                    # App wrapper
│   └── _document.tsx               # Document wrapper
├── public/                         # Static assets
├── styles/                         # Global styles
└── package.json                    # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

- **`OperationConfigSection`**: Reusable component for configuring math operations with range inputs
- **Game Logic**: Smart problem generation with reverse operations for subtraction and division
- **Score Tracking**: Automatic score saving to Supabase with user authentication

## 🌟 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain responsive design
- Add proper error handling
- Include TypeScript types for all functions

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Zetamac](https://arithmetic.zetamac.com/)
- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.

---

**Happy calculating! 🧮✨**
