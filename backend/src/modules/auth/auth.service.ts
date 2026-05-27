import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  // Static mock users for ease of local usage & demonstration
  private readonly mockUsers = [
    { id: 'U001', username: 'owner', name: 'Bapak Owner', role: 'owner', password: 'password123' },
    { id: 'U002', username: 'admin', name: 'Mbak Admin', role: 'admin', password: 'password123' },
    { id: 'U003', username: 'kasir', name: 'Mas Kasir', role: 'kasir', password: 'password123' },
  ];

  async login(body: any): Promise<{ accessToken: string; user: { id: string; username: string; name: string; role: string } }> {
    const { username, password } = body;
    const user = this.mockUsers.find(
      (u) => u.username === username && u.password === password,
    );

    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }

    // Standard dummy JWT token for local testing
    const accessToken = `mock-jwt-token-for-${user.role}-${Date.now()}`;

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }
}
