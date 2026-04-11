import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, ArrowLeft, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopUsers(users);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Container>
      <Header>
        <HeaderLeft onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
          <Title>Leaderboard K3</Title>
        </HeaderLeft>
        <Subtitle>Budaya Keselamatan Kerja</Subtitle>
      </Header>

      <HeroSection>
        <TrophyWrapper>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Trophy size={80} color="#fbbf24" />
          </motion.div>
        </TrophyWrapper>
        <h1>Pahlawan K3 Minggu Ini</h1>
        <p>Apresiasi bagi mereka yang paling peduli dengan keselamatan di pelabuhan.</p>
      </HeroSection>

      <Board>
        {loading ? (
          <LoadingText>Memuat data peringkat...</LoadingText>
        ) : (
          topUsers.map((user, index) => (
            <UserRow
              key={user.id}
              as={motion.div}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              isTop={index < 3}
            >
              <Rank>
                {index === 0 ? <Medal color="#fbbf24" size={24} /> :
                 index === 1 ? <Medal color="#94a3b8" size={24} /> :
                 index === 2 ? <Medal color="#b45309" size={24} /> :
                 index + 1}
              </Rank>
              <Avatar color={index < 3 ? '#3b82f6' : '#1e293b'}>
                {user.name?.charAt(0) || 'U'}
              </Avatar>
              <UserInfo>
                <UserName>{user.name}</UserName>
                <UserMeta>{user.division} • {user.position}</UserMeta>
              </UserInfo>
              <Points>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <span>{user.points || 0}</span>
                <small>PTS</small>
              </Points>
            </UserRow>
          ))
        )}
      </Board>

      <StatsGrid>
        <StatItem>
          <TrendingUp size={20} color="#10b981" />
          <div>
            <strong>+15%</strong>
            <span>Kenaikan Pelaporan</span>
          </div>
        </StatItem>
        <StatItem>
          <Award size={20} color="#3b82f6" />
          <div>
            <strong>24</strong>
            <span>Badge Terbit</span>
          </div>
        </StatItem>
      </StatsGrid>
    </Container>
  );
}

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  color: var(--text-primary);
  background: var(--bg-dark);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  &:hover { color: var(--primary); }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--primary);
  background: var(--accent);
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 4rem;
  h1 { font-size: 2rem; font-weight: 900; margin-bottom: 0.5rem; }
  p { color: var(--text-secondary); font-size: 1rem; }
`;

const TrophyWrapper = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
`;

const Board = styled.div`
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  border: 1px solid var(--border);
  overflow: hidden;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
`;

const UserRow = styled.div<{ isTop: boolean }>`
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: ${({ isTop }) => isTop ? 'rgba(59, 130, 246, 0.03)' : 'transparent'};
  
  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255, 255, 255, 0.02); }
`;

const Rank = styled.div`
  width: 40px;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--text-muted);
  display: flex;
  justify-content: center;
`;

const Avatar = styled.div<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 1rem;
  background: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;
  margin-right: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
`;

const UserMeta = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.1rem;
`;

const Points = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 800;
  color: #ffffff;
  
  span { font-size: 1.25rem; }
  small { font-size: 0.6rem; color: var(--text-muted); margin-top: 0.3rem; }
`;

const LoadingText = styled.div`
  padding: 4rem;
  text-align: center;
  color: var(--text-secondary);
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: flex;
  gap: 1rem;
`;

const StatItem = styled.div`
  flex: 1;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  strong { display: block; font-size: 1.1rem; color: var(--text-primary); }
  span { font-size: 0.7rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
`;
