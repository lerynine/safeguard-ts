import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Lock, Mail, ChevronRight, Anchor } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Onboarding({ onFinish }: { onFinish: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;

      onFinish({
        uid: user.uid,
        name: user.email?.split("@")[0].toUpperCase() || "USER",
        position: "Staff Pelaksana",
        division: "Operasional",
        role: user.email?.includes("admin") ? "BPO" : "USER",
        email: user.email,
      });
    } catch (error: any) {
      console.error(error);
      alert(
        error.code === "auth/wrong-password"
          ? "Password salah"
          : error.code === "auth/user-not-found"
            ? "User tidak ditemukan"
            : "Login gagal",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <GlowTop />
      <GlowBottom />

      <Card>
        <Header>
          <Logo>
            <Anchor />
          </Logo>
          <h1>SafeGuard</h1>
          <p>PT. PELINDO MULTI TERMINAL</p>
        </Header>

        <Form onSubmit={handleLogin}>
          <Field>
            <label>Email</label>
            <InputWrapper>
              <Mail />
              <input
                type="email"
                required
                placeholder="nama@pelindo.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </InputWrapper>
          </Field>

          <Field>
            <label>Password</label>
            <InputWrapper>
              <Lock />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </InputWrapper>
          </Field>

          <Submit disabled={isLoading}>
            {isLoading ? (
              <Spinner />
            ) : (
              <>
                Sign In <ChevronRight />
              </>
            )}
          </Submit>
        </Form>

        <Footer>SISTEM PELAPORAN PT. PELINDO MULTI TERMINAL</Footer>
      </Card>
    </Page>
  );
}

const fadeUp = keyframes`
  from { opacity:0; transform: translateY(24px); }
  to { opacity:1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  width: 100%;
  background: #020617;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  position: relative;
  overflow: hidden;
`;

const GlowTop = styled.div`
  position: fixed;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  top: -10%;
  left: -5%;
  background: rgba(37, 99, 235, 0.15);
`;

const GlowBottom = styled.div`
  position: fixed;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  bottom: -10%;
  right: -5%;
  background: rgba(79, 70, 229, 0.15);
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 3rem;
  border-radius: 2.5rem;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(18px);
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.45);
  animation: ${fadeUp} 0.7s ease;
  z-index: 1;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;

  h1 {
    color: white;
    font-size: 1.9rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: #94a3b8;
  }
`;

const Logo = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);

  svg {
    width: 40px;
    height: 40px;
    color: white;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #64748b;
    margin-left: 0.25rem;
  }
`;

const InputWrapper = styled.div`
  position: relative;

  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: #64748b;
  }

  input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border-radius: 1.5rem;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(100, 116, 139, 0.4);
    color: white;
    outline: none;

    &::placeholder {
      color: #475569;
    }

    &:focus {
      border-color: rgba(59, 130, 246, 0.6);
    }
  }
`;

const Submit = styled.button`
  margin-top: 0.5rem;
  padding: 1.4rem;
  border-radius: 1.5rem;
  border: none;
  background: linear-gradient(90deg, #2563eb, #4f46e5);
  color: white;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.35);

  &:disabled {
    opacity: 0.8;
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Footer = styled.div`
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #64748b;
`;