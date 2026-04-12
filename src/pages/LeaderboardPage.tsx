import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Star, ArrowLeft, TrendingUp, Award, Crown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We query users ordered by points. 
    // Note: If no users have 'points' field, this might return empty.
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTopUsers(users);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const podiumUsers = topUsers.slice(0, 3);
  const remainingUsers = topUsers.slice(3);

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Pahlawan K3 Pelindo</h1>
          <p>Apresiasi bagi mereka yang paling peduli dengan keselamatan di lingkungan pelabuhan.</p>
        </motion.div>
      </HeroSection>

      {loading ? (
        <LoadingWrapper>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <Trophy size={48} color="#fbbf24" />
          </motion.div>
          <p>Memuat data peringkat...</p>
        </LoadingWrapper>
      ) : topUsers.length > 0 ? (
        <>
          <PodiumContainer>
            {/* 2nd Place */}
            {podiumUsers[1] && (
              <PodiumItem
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                rank={2}
              >
                <PodiumAvatar>
                  <Medal color="#e2e8f0" size={32} />
                  <div className="name-initial">{podiumUsers[1].nama?.charAt(0)}</div>
                </PodiumAvatar>
                <PodiumName>{podiumUsers[1].nama}</PodiumName>
                <PodiumPoints>{podiumUsers[1].points} PTS</PodiumPoints>
                <PodiumBase height={80} color="rgba(226, 232, 240, 0.1)">2</PodiumBase>
              </PodiumItem>
            )}

            {/* 1st Place */}
            {podiumUsers[0] && (
              <PodiumItem
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                rank={1}
              >
                <PodiumAvatar>
                  <Crown color="#fbbf24" size={40} className="crown" />
                  <div className="name-initial gold">{podiumUsers[0].nama?.charAt(0)}</div>
                </PodiumAvatar>
                <PodiumName>{podiumUsers[0].nama}</PodiumName>
                <PodiumPoints>{podiumUsers[0].points} PTS</PodiumPoints>
                <PodiumBase height={120} color="rgba(251, 191, 36, 0.2)">1</PodiumBase>
              </PodiumItem>
            )}

            {/* 3rd Place */}
            {podiumUsers[2] && (
              <PodiumItem
                as={motion.div}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                rank={3}
              >
                <PodiumAvatar>
                  <Medal color="#cd7f32" size={32} />
                  <div className="name-initial bronze">{podiumUsers[2].nama?.charAt(0)}</div>
                </PodiumAvatar>
                <PodiumName>{podiumUsers[2].nama}</PodiumName>
                <PodiumPoints>{podiumUsers[2].points} PTS</PodiumPoints>
                <PodiumBase height={60} color="rgba(205, 127, 50, 0.1)">3</PodiumBase>
              </PodiumItem>
            )}
          </PodiumContainer>

          <Board>
            <AnimatePresence>
              {remainingUsers.map((user, index) => (
                <UserRow
                  key={user.id}
                  as={motion.div}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Rank>{index + 4}</Rank>
                  <Avatar>
                    {user.nama?.charAt(0) || 'U'}
                  </Avatar>
                  <UserInfo>
                    <UserName>{user.nama}</UserName>
                    <UserMeta>{user.divisi} • {user.jabatan}</UserMeta>
                  </UserInfo>
                  <Points>
                    <Star size={14} color="#fbbf24" fill="#fbbf24" />
                    <span>{user.points || 0}</span>
                    <small>PTS</small>
                  </Points>
                </UserRow>
              ))}
            </AnimatePresence>
          </Board>
        </>
      ) : (
        <EmptyState
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Trophy size={64} color="rgba(255,255,255,0.1)" />
          <h3>Belum Ada Peringkat</h3>
          <p>Mulai laporkan temuan K3 untuk mengumpulkan poin dan menjadi pahlawan keselamatan!</p>
          <ActionBtn onClick={() => navigate('/')}>LAPORKAN TEMUAN</ActionBtn>
        </EmptyState>
      )}

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
  max-width: 900px;
  margin: 0 auto;
  min-height: 100vh;
  color: #ffffff;
  background: rgba(52, 59, 92, 0.4);
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
  transition: color 0.2s;
  &:hover { color: #3b82f6; }
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
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 2rem;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.75rem; color: #ffffff; text-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  p { color: #ffffff; font-size: 1.1rem; max-width: 600px; margin: 0 auto; line-height: 1.6; }
`;

const PodiumContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 4rem;
  padding-top: 2rem;

  @media (max-width: 640px) {
    gap: 0.5rem;
  }
`;

const PodiumItem = styled.div<{ rank: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 180px;
  order: ${({ rank }) => (rank === 1 ? 2 : rank === 2 ? 1 : 3)};

  @media (max-width: 640px) {
    width: 110px;
  }
`;

const PodiumAvatar = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  .name-initial {
    width: 80px;
    height: 80px;
    border-radius: 24px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 900;
    color: white;
    box-shadow: 0 15px 35px rgba(37, 99, 235, 0.4);
    border: 4px solid rgba(255, 255, 255, 0.1);
    transform: rotate(-5deg);

    &.gold { 
      background: linear-gradient(135deg, #fbbf24, #f59e0b); 
      width: 100px; 
      height: 100px; 
      font-size: 2.5rem;
      box-shadow: 0 20px 45px rgba(245, 158, 11, 0.4);
      transform: rotate(5deg);
    }
    &.bronze { 
      background: linear-gradient(135deg, #cd7f32, #a85d1a);
      transform: rotate(-3deg);
      box-shadow: 0 15px 35px rgba(168, 93, 26, 0.4);
    }
  }

  .crown {
    position: absolute;
    top: -40px;
    z-index: 10;
    filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.6));
  }

  @media (max-width: 640px) {
    .name-initial {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
      &.gold { width: 80px; height: 80px; font-size: 2rem; }
    }
  }
`;

const PodiumName = styled.div`
  font-weight: 900;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 640px) {
    font-size: 0.85rem;
  }
`;

const PodiumPoints = styled.div`
  font-weight: 900;
  color: #fbbf24;
  font-size: 1.2rem;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`;

const PodiumBase = styled.div<{ height: number; color: string }>`
  width: 100%;
  height: ${({ height }) => height}px;
  background: ${({ color }) => color};
  border-radius: 1rem 1rem 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: none;

  @media (max-width: 640px) {
    height: ${({ height }) => height * 0.7}px;
    font-size: 2rem;
  }
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

const UserRow = styled.div`
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  
  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255, 255, 255, 0.02); }
`;

const Rank = styled.div`
  width: 40px;
  font-size: 1.1rem;
  font-weight: 900;
  color: #ffffff;
  display: flex;
  justify-content: center;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #3b82f6;
  margin-right: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 1.1rem;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 700;
  font-size: 1rem;
  color: #ffffff;
`;

const UserMeta = styled.div`
  font-size: 0.75rem;
  color: #ffffff;
  opacity: 0.8;
  margin-top: 0.1rem;
`;

const Points = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 800;
  color: #ffffff;
  
  span { font-size: 1.25rem; }
  small { font-size: 0.6rem; color: #ffffff; opacity: 0.7; margin-top: 0.3rem; }
`;

const LoadingWrapper = styled.div`
  padding: 6rem 2rem;
  text-align: center;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  p { font-weight: 600; font-size: 1.1rem; }
`;

const EmptyState = styled.div`
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 2rem;
  border: 1px dashed var(--border);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;

  h3 { font-size: 1.5rem; font-weight: 800; }
  p { color: #ffffff; opacity: 0.8; max-width: 400px; line-height: 1.6; }
`;

const ActionBtn = styled.button`
  margin-top: 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #2563eb; transform: translateY(-2px); }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatItem = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  
  strong { display: block; font-size: 1.25rem; color: #ffffff; }
  span { font-size: 0.75rem; color: #ffffff; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
`;
