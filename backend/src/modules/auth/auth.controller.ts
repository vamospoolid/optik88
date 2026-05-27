import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user to obtain access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string', example: 'admin', description: 'Available mock usernames: owner, admin, kasir' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Authentication successful.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid username or password.' })
  async login(@Body() body: any) {
    return this.authService.login(body);
  }
}
