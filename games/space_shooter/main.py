"""Egyszeru urhajos loveldozos jatek (pygame).

Iranyitas: nyilak / WASD = mozgas, SPACE = loves, R = ujrakezdes, ESC = kilepes.
"""
import random
import sys

import pygame

W, H = 480, 720
FPS = 60

pygame.init()
screen = pygame.display.set_mode((W, H))
pygame.display.set_caption("Urhajos jatek")
clock = pygame.time.Clock()
font = pygame.font.SysFont(None, 32)
big = pygame.font.SysFont(None, 64)


class Game:
    def __init__(self):
        self.player = pygame.Rect(W // 2 - 20, H - 80, 40, 40)
        self.bullets = []
        self.enemies = []
        self.stars = [[random.randrange(W), random.randrange(H), random.randint(1, 3)] for _ in range(60)]
        self.score = 0
        self.lives = 3
        self.cooldown = 0
        self.spawn_timer = 0
        self.invincible = 0
        self.over = False

    def update(self, keys):
        if self.over:
            return
        speed = 6
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.player.x -= speed
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.player.x += speed
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.player.y -= speed
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.player.y += speed
        self.player.clamp_ip(screen.get_rect())

        self.cooldown = max(0, self.cooldown - 1)
        if keys[pygame.K_SPACE] and self.cooldown == 0:
            self.bullets.append(pygame.Rect(self.player.centerx - 2, self.player.top, 4, 14))
            self.cooldown = 10

        # nehezseg a ponttal no
        self.spawn_timer -= 1
        if self.spawn_timer <= 0:
            self.enemies.append([pygame.Rect(random.randrange(W - 36), -36, 36, 36),
                                 random.uniform(2, 3.5 + self.score / 400)])
            self.spawn_timer = max(15, 50 - self.score // 40)

        for b in self.bullets:
            b.y -= 12
        self.bullets = [b for b in self.bullets if b.bottom > 0]

        for e in self.enemies:
            e[0].y += e[1]
        for e in self.enemies[:]:
            for b in self.bullets[:]:
                if e[0].colliderect(b):
                    self.enemies.remove(e)
                    self.bullets.remove(b)
                    self.score += 10
                    break
        self.invincible = max(0, self.invincible - 1)
        for e in self.enemies[:]:
            if e[0].top > H:
                self.enemies.remove(e)
            elif self.invincible == 0 and e[0].colliderect(self.player):
                self.enemies.remove(e)
                self.lives -= 1
                self.invincible = 90
                if self.lives <= 0:
                    self.over = True

        for s in self.stars:
            s[1] = (s[1] + s[2]) % H

    def draw(self):
        screen.fill((8, 8, 24))
        for x, y, v in self.stars:
            c = 60 + v * 50
            pygame.draw.rect(screen, (c, c, c), (x, y, v, v))
        for b in self.bullets:
            pygame.draw.rect(screen, (255, 230, 80), b)
        for e, _ in self.enemies:
            pygame.draw.rect(screen, (220, 60, 60), e, border_radius=6)
        if self.invincible % 10 < 5:
            p = self.player
            pygame.draw.polygon(screen, (80, 200, 255), [p.midtop, p.bottomright, p.bottomleft])
        screen.blit(font.render(f"Pont: {self.score}", True, (255, 255, 255)), (10, 10))
        screen.blit(font.render(f"Elet: {self.lives}", True, (255, 255, 255)), (W - 100, 10))
        if self.over:
            t = big.render("VEGE", True, (255, 80, 80))
            screen.blit(t, t.get_rect(center=(W // 2, H // 2 - 20)))
            t = font.render("R = ujrakezdes", True, (255, 255, 255))
            screen.blit(t, t.get_rect(center=(W // 2, H // 2 + 30)))


def main(max_frames=None):
    game = Game()
    frames = 0
    while True:
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT or (ev.type == pygame.KEYDOWN and ev.key == pygame.K_ESCAPE):
                pygame.quit()
                sys.exit()
            if ev.type == pygame.KEYDOWN and ev.key == pygame.K_r:
                game = Game()
        game.update(pygame.key.get_pressed())
        game.draw()
        pygame.display.flip()
        clock.tick(FPS)
        frames += 1
        if max_frames and frames >= max_frames:
            return game


if __name__ == "__main__":
    main()
