import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(authDto: AuthDto) {
    try {
      // Generate the password hash
      const hash = await argon.hash(authDto.password);
      //Save the new user into the db
      const user = await this.prismaService.user.create({
        data: {
          email: authDto.email,
          hash,
        },
      });

      // Delete the hash from the return
      delete user.hash;

      //Return the new user
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signin(authDto: AuthDto) {
    // Find the user in the database
    const user = await this.prismaService.user.findUnique({
      where: {
        email: authDto.email,
      },
    });
    // If the user doesnt exists throw an exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    //Compare password
    const passwordMatches = await argon.verify(user.hash, authDto.password);
    //If password is incorrect throw an exception
    if (!passwordMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }
    //Send back the user
    // delete user.hash;
    return this.signinToken(user.id, user.email);
  }

  async signinToken(userId: number, email: string): Promise<{ access_token:string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET_KEY');

    const token =  await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return {
      access_token: token,
    };
  }
}
